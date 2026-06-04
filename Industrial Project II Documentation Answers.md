CHAPTER ONE: INTRODUCTION

1.1 Background of the Implementation

Muyaye is a full-stack service marketplace system designed for Hawassa, Ethiopia. The system connects clients who need maintenance or repair services with verified local workers such as electricians, plumbers, painters, cleaners, and other skilled service providers.

The implementation addresses common problems in local service discovery, including difficulty finding trusted workers, lack of structured service request tracking, weak communication between clients and workers, and limited administrative control over reports or unsafe worker behavior. Muyaye provides one platform for clients, workers, and administrators.

The implemented system has three main user groups:

- Clients: create service requests, search recommended workers, invite workers, chat after acceptance, confirm completion, review workers, and report problems.
- Workers: register with worker identity information, maintain a worker profile, accept or decline job invitations, mark jobs as complete, and communicate with clients.
- Administrators: manage users, categories, reports, worker/account status, and view analytics.

The project is implemented as a web application with a React and Vite frontend and a Node.js, Express, TypeScript, MongoDB backend. The backend exposes REST APIs for authentication, service requests, worker profiles, recommendations, messages, uploads, and administration. Socket.IO is used for real-time chat during accepted or completed service requests.

1.2 Methods of Implementation

The system was implemented using a phased implementation strategy. Each major subsystem was built and integrated incrementally so that the team could verify one workflow before adding the next one.

The main phases were:

- Authentication and role management: registration, login, JWT session handling, email verification, password reset, and role-based navigation for client, worker, and admin users.
- Client service request workflow: request creation, image attachment, category selection, location/area entry, and request status tracking.
- Worker recommendation and assignment: ranking available workers by category match, area match, rating, completion rate, active status, and reviews.
- Worker job workflow: accepting or declining invitations, marking jobs complete, and updating profile information.
- Messaging workflow: real-time chat between the client and assigned worker after a job is accepted.
- Review and report workflow: allowing clients to rate completed workers or report unsafe/problematic service.
- Admin workflow: user management, category management, report resolution, account suspension, and analytics.
- Testing and verification: unit/API tests for health and authentication helper behavior, plus manual workflow tests for end-to-end user scenarios.

This phased strategy reduced implementation risk because each feature could be tested independently before being connected into a complete service marketplace.

CHAPTER TWO: NAMING, CODING STANDARDS AND CODING PROCESS

2.1 Algorithms

The system uses several important algorithms and logical procedures:

Worker recommendation ranking algorithm:

The recommendation service ranks workers using data from worker profiles, users, and reviews. It filters workers by minimum rating and active status, then calculates a weighted score.

Main ranking factors:

- Category match: workers whose skills match the requested service category receive the highest weight.
- Area match: workers in the same Hawassa area as the client request receive additional priority.
- Rating: workers with higher average review ratings rank higher.
- Completion rate: workers with better completion rates are preferred.
- Review count: review volume is normalized and added as a popularity/reliability factor.

The ranking formula implemented in `backend/src/services/recommendationService.ts` is:

```text
score =
  categoryMatch * 5.0 +
  areaMatch * 3.0 +
  rating * 1.0 +
  completionRate * 1.5 +
  normalizedReviewScore * 0.5
```

Recommendation reasons are also generated for display, such as "Same area", "Top rated", "Fast response", and "Category match".

Authentication algorithm:

- Passwords are hashed using Node.js crypto `scryptSync`.
- A random salt is generated for each password.
- The stored password format is `scrypt:salt:hash`.
- During login, the submitted password is hashed with the saved salt and compared to the stored hash.
- Successful login creates a JWT access token containing the user id, role, and email.

Role-based access algorithm:

- API requests use a Bearer JWT token in the Authorization header.
- Middleware validates the token and extracts the user role.
- Protected endpoints require authentication.
- Role-specific endpoints require a matching role, such as `client`, `worker`, or `admin`.

Service request status algorithm:

Service requests move through the following states:

- `SEARCHING`: the client has submitted a request and is looking for a worker.
- `PENDING`: a worker has been invited and the system is waiting for the worker decision.
- `IN_PROGRESS`: the worker accepted and the job is active.
- `COMPLETED`: the worker marked the job complete and the client confirmed completion.

Chat permission algorithm:

- Messages are allowed only when a request is `IN_PROGRESS` or `COMPLETED`.
- Only the client who created the request and the assigned worker can view or send messages.
- Socket.IO rooms are keyed by request id so messages are sent to the correct job conversation.

Report resolution algorithm:

- Clients can report workers only after a completed and confirmed request.
- Admins review reports and can set report status to pending, investigating, resolved, or dismissed.
- Dangerous reports or suspend actions can automatically suspend a worker account and deactivate the worker profile.

  2.2 Coding Standards

The project follows TypeScript-based coding standards in both frontend and backend.

File and folder naming standards:

- Backend folders are organized by responsibility: `controllers`, `routes`, `models`, `middleware`, `services`, `config`, and `scripts`.
- Frontend folders are organized by interface layer: `pages`, `components`, `services`, and `admin`.
- React page components use PascalCase names such as `DashboardPage.tsx`, `LoginPage.tsx`, and `WorkerHubPage.tsx`.
- Backend model files use PascalCase entity names such as `User.ts`, `ServiceRequest.ts`, and `WorkerProfile.ts`.
- Service/helper files use descriptive camelCase names such as `recommendationService.ts`, `emailService.ts`, and `clientRequests.ts`.

Variable and function standards:

- Variables and functions use camelCase.
- Types and interfaces use PascalCase.
- Enums describe controlled states such as request status and report status.
- Backend request validation uses Zod schemas before writing data to MongoDB.
- API responses return consistent JSON objects with messages, data payloads, and source information when useful.

Comment standards:

- Comments are used only where the logic benefits from explanation, for example security middleware, Cloudinary upload handling, recommendation scoring, and Socket.IO behavior.
- The code avoids unnecessary comments for obvious assignments.

Security coding standards:

- Passwords are never stored as plain text.
- JWT tokens are required for protected routes.
- Admin endpoints are protected by role-specific middleware.
- Express JSON body size is limited to reduce large-payload abuse.
- File upload size and file type are validated before upload.
- CORS is restricted to local development and configured frontend production URL.

  2.3 Coding Process

The coding process followed an incremental development approach.

The process included:

- Requirement analysis: identifying the three user roles and the main service marketplace workflows.
- Data model design: creating MongoDB/Mongoose models for users, worker profiles, service requests, messages, reviews, reports, categories, and recommendation snapshots.
- API development: implementing backend routes and controllers for each workflow.
- Frontend development: implementing role-based pages, layouts, service helpers, and user interaction flows.
- Integration: connecting frontend service functions to backend endpoints using `VITE_API_BASE_URL`.
- Testing: adding automated tests for health and authentication helper behavior, and planning manual tests for business workflows.
- Refinement: improving security, validation, error handling, and user workflow edge cases.

The project uses the following build and development tools:

- Frontend: React, Vite, TypeScript, React Router, Vitest, Testing Library.
- Backend: Node.js, Express, TypeScript, Mongoose, Jest, Supertest, Socket.IO, Zod.
- Database: MongoDB through Mongoose.
- Media storage: Cloudinary for uploaded images.
- Email service: Nodemailer for verification, welcome, reset password, and request notifications.

CHAPTER THREE: TESTING PROCESS

3.1 Test Plan

The test plan covers unit testing, API testing, integration testing, system testing, and user acceptance testing.

Automated test plan:

- Backend health endpoint test: verify that `/health` returns service status, timestamp, and database status metadata.
- Frontend authentication helper tests: verify token saving, session clearing, JWT expiry reading, expiration checking, and refresh API behavior.
- Component test coverage: shared UI components such as modal behavior are included in the frontend test folder.

Manual test plan:

- Client registration and login.
- Worker registration with worker role and worker ID requirement.
- Email verification and password reset.
- Client service request creation with valid and invalid input.
- Worker recommendation ranking by category and area.
- Client inviting a worker.
- Worker accepting and declining requests.
- Chat between client and worker after acceptance.
- Worker marking a job complete.
- Client confirming completion.
- Client submitting a review.
- Client submitting a report.
- Admin resolving a report and suspending a worker.
- Admin managing categories and users.

Testing environments:

- Frontend local server: `http://localhost:3000`.
- Backend local server: `http://localhost:4000`.
- MongoDB database configured through `MONGODB_URI`.
- Cloudinary image upload configured through Cloudinary environment variables.

  3.2 Test Case Design

| Test Case ID | Feature               | Input Data                                                             | Expected Result                                              | Type    |
| ------------ | --------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------ | ------- |
| TC-01        | Client registration   | Valid name, email, password, client role                               | User is created and token is returned                        | Valid   |
| TC-02        | Worker registration   | Worker role without national ID                                        | System rejects registration                                  | Invalid |
| TC-03        | Worker registration   | Worker role with recognized worker national ID                         | Worker user and worker profile are created                   | Valid   |
| TC-04        | Login                 | Correct email/password for verified active user                        | Login succeeds and role-based next route is returned         | Valid   |
| TC-05        | Login                 | Wrong password                                                         | Login fails with invalid credentials                         | Invalid |
| TC-06        | Login                 | Suspended account                                                      | Login fails with account inactive message                    | Invalid |
| TC-07        | Create request        | Category, 20+ character description, area, landmark, maintenance level | Request is saved as `SEARCHING` or `PENDING`                 | Valid   |
| TC-08        | Create request        | Description shorter than 20 characters                                 | Request is rejected by validation                            | Invalid |
| TC-09        | Worker recommendation | Request category and area match available worker                       | Matching worker ranks higher                                 | Valid   |
| TC-10        | Assign worker         | Client assigns valid worker to own request                             | Request status changes to `PENDING`                          | Valid   |
| TC-11        | Assign worker         | Client attempts to assign worker to another client request             | System returns forbidden access                              | Invalid |
| TC-12        | Worker response       | Assigned worker accepts invitation                                     | Request status changes to `IN_PROGRESS`                      | Valid   |
| TC-13        | Worker response       | Non-assigned worker attempts response                                  | System returns forbidden access                              | Invalid |
| TC-14        | Chat                  | Client/assigned worker sends message on `IN_PROGRESS` request          | Message is saved and emitted through Socket.IO               | Valid   |
| TC-15        | Chat                  | User outside request sends message                                     | System returns forbidden access                              | Invalid |
| TC-16        | Complete request      | Worker marks in-progress request complete                              | Completion timestamp is saved and client is notified in chat | Valid   |
| TC-17        | Confirm completion    | Client confirms after worker completion                                | Request status becomes `COMPLETED`                           | Valid   |
| TC-18        | Review worker         | Client reviews completed confirmed request                             | Review is saved and worker rating is recalculated            | Valid   |
| TC-19        | Review worker         | Client reviews before completion                                       | System rejects review                                        | Invalid |
| TC-20        | Report worker         | Client reports completed confirmed worker                              | Report is saved as pending                                   | Valid   |
| TC-21        | Admin resolve report  | Admin selects resolution and dangerous/suspend action                  | Report is updated and worker can be suspended                | Valid   |
| TC-22        | Category management   | Admin creates category with name/description/icon                      | Category is saved and visible to clients/workers             | Valid   |

3.3 Test Procedures

Unit testing:

- Run frontend tests with `npm run test` inside the `frontend` folder.
- Run backend tests with `npm run test` inside the `backend` folder.
- Verify individual helper functions and small isolated modules.

API testing:

- Use the included backend Postman collection in `backend/postman/FixIt-Backend.postman_collection.json`.
- Test each route with valid and invalid inputs.
- Verify HTTP status codes, JSON response structure, and authorization behavior.

Integration testing:

- Start the backend server and frontend server.
- Register users with different roles.
- Use the frontend to submit requests and confirm that backend database records are created.
- Verify that assigned worker data appears correctly in client and worker dashboards.

System testing:

- Execute the full client-to-worker workflow from registration to completed job.
- Verify all roles: client, worker, and admin.
- Test browser refresh behavior and token session persistence.
- Confirm that real-time messages appear in both client and worker sessions.

Acceptance testing:

- Demonstrate the system to target users using realistic Hawassa service scenarios.
- Ask users to complete tasks such as creating a plumbing request, accepting a job, chatting, completing the job, and rating a worker.
- Collect feedback about usability, missing service categories, and clarity of job statuses.

CHAPTER FOUR: SECURITY DESIGN & IMPLEMENTATION

4.1 Database Level Security

The system uses MongoDB through Mongoose models. Database security is handled through access control, schema validation, controlled relationships, and deployment configuration.

Implemented database protections:

- MongoDB connection string is stored in `MONGODB_URI` environment variable, not hard-coded in the source code.
- Mongoose schemas define required fields, enums, unique constraints, and indexes.
- User emails are unique and normalized to lowercase.
- User phone numbers are unique when provided.
- Review records have a unique compound index to prevent duplicate reviews for the same request, worker, and client.
- Service requests are indexed by client, assigned worker, status, and category for reliable querying.
- Messages are indexed by request and creation time for ordered conversation loading.
- Recommendation snapshots use a unique index for request/filter combinations.
- Password hashes are stored instead of plain passwords.
- Sensitive fields such as `passwordHash` are excluded from user profile responses.

Recommended database deployment controls:

- Use MongoDB Atlas or a secured MongoDB server with username/password authentication.
- Restrict database network access to the backend server IP address.
- Use least-privilege database users, for example separate read/write application credentials.
- Enable automated database backup.
- Store environment variables in secure deployment settings, not in public repositories.

  4.2 System Level Security

System-level security is implemented in the Express backend and frontend session handling.

Implemented protections:

- JWT authentication protects private API routes.
- Role-based middleware restricts client, worker, and admin actions.
- Admin APIs are protected by `admin` role requirement.
- Helmet is used to set secure HTTP headers.
- CORS is restricted to `http://localhost:3000` and the configured production frontend URL.
- Global rate limiting protects the API from excessive requests.
- Authentication-specific rate limiting protects login and registration endpoints.
- Express request JSON size is limited to 1 MB.
- Zod validates important request bodies such as login, registration, request creation, worker decisions, and profile updates.
- Uploads are restricted to image file types.
- Upload file size is limited to 5 MB.
- Cloudinary credentials are loaded from environment variables.
- Chat access is restricted to the request owner and assigned worker.
- Reviews and reports are allowed only after a completed and client-confirmed service request.
- Suspended users cannot log in.
- Worker profiles can be deactivated when accounts are suspended.

Security limitations and future improvements:

- The development JWT fallback secret should be replaced with a strong production secret.
- Worker national ID verification currently uses a dummy allowed list and should be integrated with a real verification process in production.
- Email verification must be fully configured with production SMTP settings.
- HTTPS should be enforced in production.
- Audit logs should be added for admin actions.

CHAPTER FIVE: SYSTEM DEPLOYMENT STRATEGY

5.1 Deployment Strategies

The recommended deployment approach is a phased deployment strategy.

Local deployment:

- Frontend runs on Vite at `http://localhost:3000`.
- Backend runs on Express at `http://localhost:4000`.
- MongoDB is configured using `MONGODB_URI`.
- Frontend API base URL is configured using `VITE_API_BASE_URL=http://localhost:4000`.

Production deployment:

- Deploy the frontend as a static React/Vite build to a hosting provider such as Vercel, Netlify, or a static web server.
- Deploy the backend Node.js API to a server or cloud platform such as Render, Railway, Fly.io, or a VPS.
- Deploy MongoDB on MongoDB Atlas or a secured MongoDB server.
- Configure Cloudinary for uploaded request images, avatars, and portfolio images.
- Configure SMTP credentials for email verification, password reset, and notifications.
- Set the production frontend URL in the backend CORS environment configuration.

Deployment steps:

1. Build the frontend with `npm run build` in the `frontend` folder.
2. Build the backend with `npm run build` in the `backend` folder.
3. Configure production environment variables.
4. Start the backend with `npm start`.
5. Deploy the frontend `dist` output.
6. Run smoke tests for login, request creation, worker assignment, and admin access.

5.2 User Training Strategies

Training should be role-based because each user group has different responsibilities.

Client training:

- How to register and verify email.
- How to create a service request.
- How to choose category, area, landmark, maintenance level, and photos.
- How to view recommended workers.
- How to invite a worker and track request status.
- How to chat after a worker accepts.
- How to confirm completion, review, and report.

Worker training:

- How to register as a worker.
- How to update profile, skills, area, avatar, portfolio, and social/contact details.
- How to accept or decline job invitations.
- How to communicate with clients.
- How to mark completed work.

Admin training:

- How to view dashboard analytics.
- How to manage users and account status.
- How to manage service categories.
- How to investigate and resolve reports.
- How to suspend unsafe workers when necessary.

Training methods:

- Live demonstration.
- Short video walkthroughs.
- Printed quick-start guide.
- Practice accounts for client, worker, and admin roles.
- Help page inside the application.

  5.3 User Manual

Client user manual:

1. Open the Muyaye web application.
2. Register as a client using full name, email, password, phone, and area.
3. Verify the email address if verification is required.
4. Log in and open the dashboard.
5. Select "Request Service".
6. Choose a service category.
7. Enter the problem description, area, landmark, maintenance level, and optional photos.
8. Submit the request.
9. Review recommended workers and invite the preferred worker.
10. Wait for the worker to accept or decline.
11. When the worker accepts, open messages and discuss the job.
12. After the worker marks the job complete, inspect the work and confirm completion.
13. Submit a rating/review or report the worker if there was a serious issue.

Worker user manual:

1. Register as a worker with valid worker registration details.
2. Log in and open the worker hub.
3. Complete the worker profile with service title, bio, skills, area, phone, avatar, and portfolio.
4. Review incoming job invitations.
5. Accept jobs that match availability and skill.
6. Decline jobs that cannot be completed.
7. Use messages to communicate with the client after accepting.
8. Complete the work and mark the job complete.
9. Wait for the client to confirm completion.

Admin user manual:

1. Log in using an admin account.
2. Open the admin dashboard.
3. Use user management to search, view, update, activate, or suspend users.
4. Use category management to add, edit, activate, deactivate, or delete categories.
5. Use report management to investigate client reports.
6. Resolve reports by setting status, feedback, and resolution action.
7. Suspend dangerous workers when needed.
8. Review analytics to monitor user growth, request trends, pending reports, and recent activity.

5.4 Installation Strategies

System requirements:

- Node.js installed.
- npm installed.
- MongoDB database or MongoDB Atlas connection string.
- Cloudinary account for image uploads.
- SMTP/email credentials for email features.

Frontend installation:

```bash
cd frontend
npm install
npm run dev
```

Backend installation:

```bash
cd backend
npm install
npm run dev
```

Required frontend environment variable:

```text
VITE_API_BASE_URL=http://localhost:4000
```

Required backend environment variables:

```text
PORT=4000
MONGODB_URI=<mongodb connection string>
JWT_SECRET=<strong secret key>
CLOUDINARY_CLOUD_NAME=<cloudinary cloud name>
CLOUDINARY_API_KEY=<cloudinary api key>
CLOUDINARY_API_SECRET=<cloudinary api secret>
FRONTEND_URL=<production frontend url>
```

Optional setup:

- Run `npm run seed` in the backend folder if seed data is needed.
- Run backend tests using `npm run test`.
- Run frontend tests using `npm run test`.

CHAPTER SIX: SYSTEM MAINTENANCE STRATEGY

6.1 System Modification Strategy

The system should be maintained using controlled incremental changes.

Recommended modification process:

- Keep frontend and backend changes separated by feature.
- Add or update Mongoose models when new data is required.
- Add backend validation schemas for new API payloads.
- Add frontend service helpers when new endpoints are introduced.
- Add tests for authentication, request workflow, admin actions, and recommendation changes.
- Use version control branches for new features and bug fixes.
- Review code before merging to the main branch.
- Keep dependencies updated after testing compatibility.

Possible future modifications:

- Integrate real government or institutional worker ID verification.
- Add payment or escrow support.
- Add GPS/distance-based worker matching.
- Add push notifications or SMS notifications.
- Add stronger analytics for service categories and worker performance.
- Add multilingual interface support for Amharic, Sidama, and English.
- Add admin audit logs.
- Add dispute escalation workflow.
- Add worker availability scheduling.

  6.2 Backup and Recovery Strategy

Backup strategy:

- Enable automated MongoDB backups in MongoDB Atlas or the database host.
- Keep daily backups for short-term recovery.
- Keep weekly or monthly backups for long-term recovery.
- Back up uploaded media metadata and rely on Cloudinary storage for image files.
- Export important reports and analytics periodically for administrative records.
- Store environment configuration securely in the deployment platform.

Recovery strategy:

- Restore MongoDB from the latest valid backup when data loss occurs.
- Verify user records, service requests, messages, reports, and reviews after restoration.
- Reconnect backend environment variables to the restored database.
- Restart backend and frontend deployments.
- Run smoke tests for login, request creation, worker assignment, and admin report viewing.
- If Cloudinary media links are affected, verify image URLs and re-upload missing important files.

Maintenance schedule:

- Daily: monitor server errors and database connection status.
- Weekly: review pending reports and failed email/upload logs.
- Monthly: update dependencies after testing.
- Quarterly: review security settings, CORS origins, JWT secret rotation policy, and backup restoration process.

CHAPTER SEVEN: CONCLUSION AND RECOMMENDATION

7.1 Conclusion

Muyaye successfully implements a full-stack service marketplace for connecting clients and local workers in Hawassa. The system includes role-based authentication, worker profiles, service request management, worker recommendation ranking, job assignment, real-time messaging, completion confirmation, reviews, reports, category management, and admin analytics.

The project demonstrates practical use of modern web technologies including React, Vite, TypeScript, Express, MongoDB, Socket.IO, Cloudinary, JWT authentication, and automated testing tools. The system also includes meaningful security controls such as password hashing, role-based access, request validation, rate limiting, upload restrictions, and admin-level account moderation.

Overall, the implemented system satisfies the main goal of improving trust, organization, and communication in local maintenance service delivery.

7.2 Recommendations

The following improvements are recommended for future versions:

- Replace dummy worker ID verification with a real verification system.
- Add GPS-based distance calculation for more accurate worker recommendations.
- Add SMS or mobile push notifications for users who do not check email frequently.
- Add online payment support with clear refund/dispute policies.
- Add audit logging for every admin action.
- Add more automated integration tests for the full service request lifecycle.
- Add mobile application support for easier access by workers and clients.
- Add multilingual support for wider local usability.
- Improve analytics with category demand, response time, completion rate, and worker reliability reports.

References

- React documentation: https://react.dev/
- Vite documentation: https://vite.dev/
- Express documentation: https://expressjs.com/
- MongoDB documentation: https://www.mongodb.com/docs/
- Mongoose documentation: https://mongoosejs.com/docs/
- Socket.IO documentation: https://socket.io/docs/
- JSON Web Token documentation: https://jwt.io/
- Cloudinary documentation: https://cloudinary.com/documentation
- Zod documentation: https://zod.dev/
- Jest documentation: https://jestjs.io/
- Vitest documentation: https://vitest.dev/

Appendix

Appendix A: Main project structure

```text
FixIt-Hawassa-/
  frontend/
    admin/
    components/
    pages/
    services/
    App.tsx
    package.json
    vite.config.ts
  backend/
    src/
      config/
      controllers/
      middleware/
      models/
      routes/
      services/
      server.ts
      socket.ts
    package.json
```

Appendix B: Main backend routes

```text
/auth
/requests
/recommendations
/workers
/messages
/admin
/upload
/categories
/health
```

Appendix C: Main database collections

```text
Users
WorkerProfiles
ServiceRequests
Messages
Reviews
Reports
Categories
RecommendationSnapshots
```

Appendix D: Main frontend pages

```text
LandingPage
LoginPage
RegisterPage
DashboardPage
ServiceRequestPage
SearchResultsPage
WorkerProfilePage
MessagesPage
MyRequestsPage
WorkerHubPage
EditWorkerProfilePage
ClientReportsPage
Admin User Management
Admin Category Management
Admin Report Management
Admin Analytics
Admin Settings
```
