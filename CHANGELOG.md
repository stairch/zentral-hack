# Changelog

## [1.20.0] - 2026-10-25

### Added

- Support for sorting post event gallery
- Multiple partners per challenge

### Changed

- Redesign live and recap structure in admin panel

### Fixed

- Missing authentication on registration

## [1.19.2] - 2026-10-25

### Fixed

- Various design fixes

## [1.19.1] - 2026-10-25

### Fixed

- Colors of ranks and solo rank design

## [1.19.0] - 2026-10-25

### Changed

- Winners are shown per challenge
- Gallery photos are compressed

## [1.18.0] - 2026-10-24

### Added

- Split saving and publishing post event page

### Fixed

- Admins couldn't change category admins

## [1.17.0] - 2026-10-24

### Added

- Support for post event landing page

## [1.16.0] - 2026-10-24

### Added

- Banners to landing page if logged in

### Fixed

- Super admins cannot change their category

## [1.15.2] - 2026-10-24

### Fixed

- Git repositories not shown in admin panel

## [1.15.1] - 2026-10-24

### Fixed

- File uploads capped to 4.5MB. Now sizes possible up to 20MB

## [1.15.0] - 2026-10-23

### Added

- Support for alert banner

## [1.14.4] - 2026-10-23

### Fixed

- Fix can't delete user from teams

## [1.14.3] - 2026-10-23

### Added

- Add teams filter

## [1.14.2] - 2026-10-23

### Fixed

- Users not added to challenge if added via teams

## [1.14.1] - 2026-10-22

### Fixed

- Various bugs

## [1.14.0] - 2026-10-22

### Added

- Support for publishing challenge infos to users dashboard
- Support for Challenge deadlines incl. banner and tab blinking
- Support for teams and internal rankings and notes
- Support for documents

### Changed

- New design of challenges table in admin panel
- Make more groups in admin sidebar

### Fixed

- Set language not stored properly
- Participants count on admin dashboard

## [1.13.1] - 2026-10-15

### Fixed

- Challenge submission not deleted on category change

## [1.13.0] - 2026-10-14

### Added

- Super admins can change user's category

### Fixed

- Participants count in admin dashboard page not correct
- Users were able to change category even when the category was full/closed

## [1.12.1] - 2026-10-08

### Fixed

- Sponsor inquiry text is cut after certain length

## [1.12.0] - 2026-10-06

### Added

- Support for sending e-mails to all participants and by category
- Support for challenge sign ups and submissions

## [1.11.1] - 2026-10-04

### Fixed

- Admins and super admins being counted as participants
- Category badges not consistent in users table

## [1.11.0] - 2026-09-16

### Added

- Support for limiting registrations

### Changed

- Merged registration admin page to users page

## [1.10.0] - 2026-09-11

### Added

- Confirmation dialog to newsletter send dialog
- Contact count to newsletter send dialog
- Support for newsletter test emails

## [1.9.0] - 2026-09-10

### Added

- Support for creating and sending e-mail campaigns via Resend
- Support for choosing Resend templates for each transactional e-mail (system messages)

### Fixed

- Various security vulnerabilities from dependencies

## [1.8.0] - 2026-09-05

### Added

- Add support for more focused category cards including short descriptions, editing order, and switching between uniform and focused cards layout
- Add GitHub social link to footer

### Changed

- Change headline in hero section from "An hackathon" to "The hackathon"

### Fixed

- English labels not same as german in user profile section

## [1.7.0] - 2026-08-29

### Added

- Redesign of user profile
- Support of editing user information
- Vercel Analytics and Speed Insights (Performance Monitoring)

### Fixed

- Register abortion blocks unverified e-mail

## [1.6.2] - 2026-08-29

### Fixed

- Images not loaded due to Vercel Image Optimization limits

## [1.6.0] - 2026-08-28

### Added

- Separate German and English fields for challenge title and short description in the sponsor challenge editor
- Sponsor selection in the challenge editor to link a challenge to a confirmed or published sponsor
- "Powered by " badge on challenge cards on the landing page

### Fixed

- Changelog announcement shown on every first visit after login, even changelog already seen
- Color and layout bugs on challenge cards

## [1.5.0] - 2026-08-25

### Added

- Changelog with version announcements in the admin panel
- Sponsor logo description
- Option to add sponsors manually in the admin panel
- Pulsing dot indicator on new sponsor inquiries in the admin panel
- Full width loading screen on the admin panel
- New SEO keywords to page metadata

### Changed

- Partner and sponsor logo preview changed to a grid layout
- Language dropdown moved higher in the admin sidebar

### Fixed

- Session token not invalidated on logout
- Various security vulnerabilities from dependencies

## [1.4.0] - 2026-08-20

### Added

- Biggest sponsors to hero section on the landing page

## [1.3.0] - 2026-08-19

### Added

- Logo size slider for sponsors in the admin panel

### Changed

- Refactored sponsors structure in the admin panel
- Increased logo upload quality

## [1.2.2] - 2026-08-13

### Fixed

- Sponsor logo deleted when publishing without changing the logo

## [1.2.1] - 2026-05-18

### Fixed

- Increased database connection timeout to handle cold starts

## [1.2.0] - 2026-05-18

### Added

- Bug report and feature request links in the admin sidebar
- Back button in the admin sidebar
- Unsaved changes indicator in the About Stats admin panel
- Redis-based rate limiter for improved reliability

### Fixed

- Color contrasts for admin dashboard icons

## [1.1.0] - 2026-05-05

### Added

- English prize description support in categories
- Database migration workflow

### Fixed

- Color contrasts in sponsor request modal
- Legal page content updated

## [1.0.0] - 2026-05-04

- Initial public release of Zentral Hack platform
