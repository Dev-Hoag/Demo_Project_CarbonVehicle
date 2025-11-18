-- Add CERTIFICATE_GENERATED notification templates
USE notification_service_db;

INSERT INTO notification_templates (code, event_type, channel, title_template, content_template, variables, is_active)
VALUES 
('CERT_GEN_EMAIL', 'CERTIFICATE_GENERATED', 'EMAIL', 
'Certificate Generated Successfully', 
'Congratulations! Your Carbon Credit Certificate #{{certificate_id}} has been generated. Hash: {{cert_hash}}. You can download it from your dashboard.', 
'{"certificate_id": "string", "cert_hash": "string", "user_id": "string", "trip_id": "string"}', 
1),

('CERT_GEN_PUSH', 'CERTIFICATE_GENERATED', 'PUSH', 
'Certificate Ready', 
'Your certificate #{{certificate_id}} is ready to download!', 
'{"certificate_id": "string"}', 
1),

('CERT_GEN_INAPP', 'CERTIFICATE_GENERATED', 'IN_APP', 
'Certificate Generated', 
'Your Carbon Credit Certificate has been successfully generated and is ready for download.', 
'{"certificate_id": "string", "cert_hash": "string"}', 
1);
