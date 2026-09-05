# Changelog

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
