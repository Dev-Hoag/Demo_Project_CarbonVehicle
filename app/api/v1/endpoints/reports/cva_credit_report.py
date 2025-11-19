"""
CVA Credit Issuance Report Endpoint
Báo cáo tín chỉ đã phát hành dành riêng cho CVA
"""

from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, extract, case, text
from app.config.database import get_db
from app.models.verification import Verification, VerificationStatus
from app.api.deps import get_current_cva_user, CurrentUser
from pydantic import BaseModel
from decimal import Decimal

router = APIRouter()


# ============================================
# Response Models
# ============================================

class CVACreditSummary(BaseModel):
    """Tổng quan tín chỉ đã phát hành"""
    total_verifications: int
    approved_count: int
    rejected_count: int
    pending_count: int
    total_co2_saved_kg: float
    total_credits_issued: float
    approval_rate: float
    
    class Config:
        from_attributes = True


class MonthlyIssuance(BaseModel):
    """Phát hành tín chỉ theo tháng"""
    year: int
    month: int
    month_name: str
    approved_count: int
    total_credits: float
    total_co2_kg: float
    
    class Config:
        from_attributes = True


class VerifierPerformance(BaseModel):
    """Hiệu suất từng verifier"""
    verifier_id: str
    verifier_name: Optional[str]
    total_verifications: int
    approved_count: int
    rejected_count: int
    pending_count: int
    total_credits_issued: float
    avg_processing_time_hours: Optional[float]
    
    class Config:
        from_attributes = True


class CVACreditReport(BaseModel):
    """Báo cáo tổng hợp CVA"""
    summary: CVACreditSummary
    monthly_issuance: list[MonthlyIssuance]
    verifier_performance: list[VerifierPerformance]
    generated_at: datetime
    report_period: str
    
    class Config:
        from_attributes = True


# ============================================
# Endpoints
# ============================================

@router.get("/cva/credit-issuance", response_model=CVACreditReport)
async def get_cva_credit_report(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    verifier_id: Optional[str] = Query(None, description="Filter by specific verifier"),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_cva_user)
):
    """
    Báo cáo tín chỉ đã phát hành cho CVA
    
    Bao gồm:
    - Tổng số verifications theo trạng thái
    - Tổng CO2 giảm phát thải
    - Tổng tín chỉ đã phát hành
    - Phát hành theo tháng
    - Hiệu suất từng verifier
    """
    
    # Parse dates
    date_filter = []
    if start_date:
        start_dt = datetime.strptime(start_date, "%Y-%m-%d")
        date_filter.append(Verification.created_at >= start_dt)
    else:
        # Default: last 6 months
        start_dt = datetime.now() - timedelta(days=180)
        date_filter.append(Verification.created_at >= start_dt)
    
    if end_date:
        end_dt = datetime.strptime(end_date, "%Y-%m-%d")
        date_filter.append(Verification.created_at <= end_dt)
    
    # Add verifier filter if specified
    if verifier_id:
        date_filter.append(Verification.verifier_id == verifier_id)
    
    # 1. Summary Statistics
    summary_query = db.query(
        func.count(Verification.id).label('total'),
        func.sum(
            case(
                (Verification.status == VerificationStatus.APPROVED, 1),
                else_=0
            )
        ).label('approved'),
        func.sum(
            case(
                (Verification.status == VerificationStatus.REJECTED, 1),
                else_=0
            )
        ).label('rejected'),
        func.sum(
            case(
                (Verification.status == VerificationStatus.PENDING, 1),
                else_=0
            )
        ).label('pending'),
        func.sum(Verification.co2_saved_kg).label('total_co2'),
        func.sum(
            case(
                (Verification.status == VerificationStatus.APPROVED, Verification.credits_suggested),
                else_=0
            )
        ).label('total_credits')
    ).filter(and_(*date_filter))
    
    summary_result = summary_query.first()
    
    total = summary_result.total or 0
    approved = int(summary_result.approved or 0)
    rejected = int(summary_result.rejected or 0)
    pending = int(summary_result.pending or 0)
    total_co2 = float(summary_result.total_co2 or 0)
    total_credits = float(summary_result.total_credits or 0)
    approval_rate = (approved / total * 100) if total > 0 else 0
    
    summary = CVACreditSummary(
        total_verifications=total,
        approved_count=approved,
        rejected_count=rejected,
        pending_count=pending,
        total_co2_saved_kg=total_co2,
        total_credits_issued=total_credits,
        approval_rate=round(approval_rate, 2)
    )
    
    # 2. Monthly Issuance
    monthly_query = db.query(
        extract('year', Verification.signed_at).label('year'),
        extract('month', Verification.signed_at).label('month'),
        func.count(Verification.id).label('approved_count'),
        func.sum(Verification.credits_suggested).label('total_credits'),
        func.sum(Verification.co2_saved_kg).label('total_co2')
    ).filter(
        and_(
            Verification.status == VerificationStatus.APPROVED,
            Verification.signed_at.isnot(None),
            *date_filter
        )
    ).group_by(
        extract('year', Verification.signed_at),
        extract('month', Verification.signed_at)
    ).order_by(
        extract('year', Verification.signed_at).desc(),
        extract('month', Verification.signed_at).desc()
    )
    
    monthly_results = monthly_query.all()
    
    month_names = {
        1: "January", 2: "February", 3: "March", 4: "April",
        5: "May", 6: "June", 7: "July", 8: "August",
        9: "September", 10: "October", 11: "November", 12: "December"
    }
    
    monthly_issuance = [
        MonthlyIssuance(
            year=int(row.year),
            month=int(row.month),
            month_name=month_names[int(row.month)],
            approved_count=row.approved_count,
            total_credits=float(row.total_credits or 0),
            total_co2_kg=float(row.total_co2 or 0)
        )
        for row in monthly_results
    ]
    
    # 3. Verifier Performance
    verifier_query = db.query(
        Verification.verifier_id,
        func.count(Verification.id).label('total'),
        func.sum(
            case(
                (Verification.status == VerificationStatus.APPROVED, 1),
                else_=0
            )
        ).label('approved'),
        func.sum(
            case(
                (Verification.status == VerificationStatus.REJECTED, 1),
                else_=0
            )
        ).label('rejected'),
        func.sum(
            case(
                (Verification.status == VerificationStatus.PENDING, 1),
                else_=0
            )
        ).label('pending'),
        func.sum(
            case(
                (Verification.status == VerificationStatus.APPROVED, Verification.credits_suggested),
                else_=0
            )
        ).label('credits_issued'),
        func.avg(
            text("TIMESTAMPDIFF(HOUR, verifications.created_at, verifications.signed_at)")
        ).label('avg_hours')
    ).filter(
        and_(*date_filter)
    ).group_by(
        Verification.verifier_id
    ).order_by(
        func.count(Verification.id).desc()
    )
    
    verifier_results = verifier_query.all()
    
    verifier_performance = [
        VerifierPerformance(
            verifier_id=row.verifier_id or "Unassigned",
            verifier_name=None,  # TODO: Fetch from User Service
            total_verifications=row.total,
            approved_count=int(row.approved or 0),
            rejected_count=int(row.rejected or 0),
            pending_count=int(row.pending or 0),
            total_credits_issued=float(row.credits_issued or 0),
            avg_processing_time_hours=round(float(row.avg_hours), 2) if row.avg_hours else None
        )
        for row in verifier_results
    ]
    
    # Report metadata
    report_period = f"{start_date or 'Last 6 months'} to {end_date or 'Today'}"
    
    return CVACreditReport(
        summary=summary,
        monthly_issuance=monthly_issuance,
        verifier_performance=verifier_performance,
        generated_at=datetime.now(),
        report_period=report_period
    )


@router.get("/cva/export", summary="Export CVA report to CSV")
async def export_cva_report_csv(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_cva_user)
):
    """
    Xuất báo cáo CVA sang CSV
    """
    from fastapi.responses import StreamingResponse
    import io
    import csv
    
    # Get data (reuse logic from above)
    date_filter = []
    if start_date:
        date_filter.append(Verification.created_at >= datetime.strptime(start_date, "%Y-%m-%d"))
    if end_date:
        date_filter.append(Verification.created_at <= datetime.strptime(end_date, "%Y-%m-%d"))
    
    verifications = db.query(Verification).filter(and_(*date_filter)).all()
    
    # Create CSV
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow([
        "Verification ID", "Trip ID", "User ID", "Verifier ID",
        "CO2 Saved (kg)", "Credits Issued", "Status",
        "Created At", "Signed At", "Remarks"
    ])
    
    # Data rows
    for v in verifications:
        writer.writerow([
            v.id, v.trip_id, v.user_id, v.verifier_id or "N/A",
            float(v.co2_saved_kg), 
            float(v.credits_suggested if v.status == VerificationStatus.APPROVED else 0),
            v.status.value,
            v.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            v.signed_at.strftime("%Y-%m-%d %H:%M:%S") if v.signed_at else "N/A",
            v.remarks or ""
        ])
    
    output.seek(0)
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=cva_report_{datetime.now().strftime('%Y%m%d')}.csv"
        }
    )
