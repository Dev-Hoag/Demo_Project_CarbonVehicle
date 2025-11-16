-- Update existing templates with body content and add new templates
INSERT INTO notification_templates (code, event_type, title_template, content_template, channel, variables, is_active) VALUES
-- Update existing templates
('TRIP_VERIFIED', 'trip.verified', 'Trip Verified Successfully', 'Your trip on {{tripDate}} has been verified! You earned {{carbonCredits}} carbon credits.', 'IN_APP', '["tripDate", "carbonCredits"]', 1),
('LISTING_CREATED', 'listing.created', 'Listing Published', 'Your listing "{{listingTitle}}" for {{creditAmount}} credits at {{price}} {{currency}} is now live!', 'IN_APP', '["listingTitle", "creditAmount", "price", "currency"]', 1),
('CREDIT_ISSUED', 'credit.issued', 'Carbon Credits Issued', 'Congratulations! {{amount}} carbon credits have been issued to your wallet.', 'IN_APP', '["amount"]', 1),
-- New templates
('LISTING_SOLD', 'listing.sold', 'Listing Sold', 'Your listing "{{listingTitle}}" has been sold for {{price}} {{currency}}!', 'IN_APP', '["listingTitle", "price", "currency"]', 1),
('WITHDRAWAL_APPROVED', 'withdrawal.approved', 'Withdrawal Approved', 'Your withdrawal request of {{amount}} {{currency}} has been approved and processed.', 'IN_APP', '["amount", "currency"]', 1),
('WITHDRAWAL_REJECTED', 'withdrawal.rejected', 'Withdrawal Rejected', 'Your withdrawal request of {{amount}} {{currency}} was rejected. Reason: {{reason}}', 'IN_APP', '["amount", "currency", "reason"]', 1),
('USER_REGISTERED', 'user.registered', 'Welcome to Carbon Credit Market', 'Welcome {{userName}}! Your account has been created successfully. Start earning carbon credits today!', 'IN_APP', '["userName"]', 1)
ON DUPLICATE KEY UPDATE 
  title_template = VALUES(title_template),
  content_template = VALUES(content_template),
  variables = VALUES(variables);
