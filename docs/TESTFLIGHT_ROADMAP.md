# TestFlight roadmap

TestFlight publication is intentionally not automated by this sprint.

## Required ownership and product data

- Active Apple Developer Program membership.
- Access to App Store Connect.
- Confirmed production bundle identifier `ru.tochkarosta.app`.
- App name, subtitle, category and support/privacy URLs.
- Privacy descriptions matching camera, QR/barcode and image-picker usage.
- Privacy nutrition details for on-device profile, diary and images.
- Screenshots for supported iPhone sizes and, while enabled, iPad.
- Age rating questionnaire.
- Beta description, testing focus and tester contact details.
- Export-compliance answers.

## Build process

1. Confirm production version and increment iOS build number.
2. Run all local checks and migration smoke tests.
3. Create a production EAS build without automatic submission.
4. Verify bundle identifier, icon, splash, permissions and build info.
5. Submit the selected binary to App Store Connect only with explicit approval.
6. Start with internal testers.
7. Add external testers only after completing Apple's Beta App Review requirements.

External groups require review of the Beta description, test notes, privacy behavior and credentials where applicable. Version/build numbering must remain monotonic. Production submission and release are separate user-approved operations.
