# Career Compass

JobOS — AI Career Intelligence Platform

Build a production-quality full-stack SaaS application called JobOS.

JobOS is an AI-powered Career Intelligence Platform. It is NOT a generic resume generator, generic chatbot, or simple job board.

Its purpose is to become an intelligent career agent that understands the user's career, specializes itself to the user's professional field, discovers relevant opportunities, evaluates and ranks them, recommends which opportunities to pursue first, helps optimize applications, prepares the user for interviews, tracks outcomes, learns from the user's results, and continuously improves the user's job-search strategy.

The long-term product vision is:

Understand the candidate → Understand their field → Discover opportunities → Evaluate opportunities → Rank opportunities → Recommend actions → Optimize applications → Prepare for interviews → Track outcomes → Learn → Improve career strategy

The application must be designed from the beginning so that this full vision can be implemented without requiring a major architectural rewrite later.

1. Product Principles

JobOS must follow these principles:

AI is a core reasoning and intelligence layer throughout the application, not merely a chat feature.

The system must specialize itself according to the user's career field, specialization, experience level, goals, geography, skills, preferences, and constraints.

A Computer Engineering candidate and a Registered Nurse should receive substantially different career analysis because the application understands their professional domains.

Job recommendations must be explainable. The user should understand why a job was recommended, why it received its score, what strengths match, what gaps exist, and what risks or concerns exist.

Never fabricate candidate experience, credentials, licenses, employment history, projects, skills, education, achievements, or other qualifications.

Separate deterministic application logic from AI reasoning. Database state, calculations, permissions, application statuses, subscription status, etc. must not depend on unreliable AI output.

User data is private by default.

Build a real application, not a collection of mockups.

Use reusable components and a coherent design system.

Design for future expansion into a large career-intelligence platform.

2. Technology Foundation

Use the following architecture unless there is a strong technical reason to improve it:

Frontend:

React

TypeScript

modern responsive web application

component-based architecture

clean reusable UI system

Backend:

Supabase

PostgreSQL

Supabase Authentication

Supabase Storage

Supabase Edge Functions where server-side logic or external API integrations are required

Version control:

GitHub integration

Keep the project organized and production maintainable

AI:

Implement an abstraction layer for AI providers rather than tightly coupling the application to one provider.

AI calls that use private API keys must happen server-side.

Never expose private model API keys in client-side code.

Store secrets securely.

Payments:

Architect for Stripe subscriptions, but do not implement complex billing logic until the product foundation is stable.

Email:

Architect for transactional email and notifications.

External job data:

Design a provider-agnostic job ingestion layer.

Never assume that one job source will remain the permanent source.

Jobs should be normalized into our own internal schema.

3. Security Requirements

Security is a first-class requirement.

Implement:

authenticated user access

proper authorization

row-level security in Supabase

user-owned records

secure file storage

server-side secret handling

no API secrets in frontend code

protected Edge Functions

validation of external inputs

protection against prompt injection wherever external job descriptions or uploaded content are processed

safe handling of uploaded resumes and documents

audit-friendly architecture

Every user should only be able to access their own private career data, applications, uploaded documents, interview data, and personal information.

Do not use insecure shortcuts merely to make the prototype work.

4. Core Data Model

Design the PostgreSQL schema around the following major entities.

Users:

user profile

authentication relationship

Career Profiles:

target career

career category

specialization

career level

professional summary

career goals

target roles

target industries

target employers

preferred locations

remote/hybrid/on-site preferences

salary expectations

relocation preference

travel preference

work authorization information where appropriate

other constraints

Career Specializations:

profession

specialty

sub-specialty

industry

role families

relevant skills

certifications

common qualifications

terminology

career progression information

specialty-specific evaluation criteria

Education:

institution

degree

field

dates

GPA when supplied

coursework

academic projects

Experience:

employer

title

dates

responsibilities

achievements

technologies

skills

quantified results

Skills:

skill

category

proficiency

evidence source

years of experience when known

Certifications:

certification

issuer

date

expiration

Projects:

project name

description

technologies

outcome

skills demonstrated

Career Goals:

target role

long-term objective

desired industry

timeline

desired compensation

location preferences

career priorities

Jobs:

external source

external job ID

company

title

description

location

compensation

employment type

seniority

requirements

preferred qualifications

skills

certifications

degree requirements

years of experience

industry

posting date

application deadline if available

application URL

source URL

normalized job data

status

Job Analyses:

candidate/job relationship

match score

skills score

experience score

education score

location score

compensation score

career trajectory score

preferences score

risk factors

missing qualifications

strengths

AI reasoning

recommendation

recommendation priority

Job Recommendations:

job

candidate

ranking

priority

reasoning

recommended action

generated timestamp

Applications:

job

company

position

status

date saved

date applied

resume version

cover letter version

recruiter

interview status

follow-up date

notes

outcome

Documents:

resume

cover letter

application document

interview notes

document versioning metadata

Interviews:

application

interview type

date

interviewer

status

notes

preparation status

Interview Sessions:

application

questions

answers

evaluations

scores

feedback

improvement recommendations

Follow-ups:

application

type

date due

date sent

generated message

status

Career Analytics:

applications

responses

interviews

final rounds

offers

conversion rates

role performance

industry performance

geographic performance

resume version performance

job-score performance

other useful career-search metrics

AI Activity:

analysis type

input reference

output reference

model/provider metadata

timestamp

token/cost metadata when available

user-visible reasoning summary where appropriate

Notifications:

user

type

priority

message

action

read status

timestamp

Subscriptions:

user

plan

provider customer ID

provider subscription ID

status

billing period

timestamps

Create the schema in a way that supports future additions without breaking the existing product.

5. Career Specialization Engine

This is one of the defining capabilities of JobOS.

Do NOT hard-code the application around one profession.

Instead build a dynamic Career Specialization Engine.

A user may enter:

"Computer Engineering"

The system should identify possible specializations such as:

Embedded Systems

Firmware

FPGA / RTL

Hardware Design

Semiconductor

Verification

Robotics

Controls

Automotive Electronics

Aerospace/Defense

Hardware Validation

Digital Systems

Other related paths

A user may enter:

"Nursing"

The system should dynamically recognize relevant branches such as:

Registered Nurse

New Graduate RN

ICU

Emergency Department

Pediatrics

Oncology

Operating Room

Critical Care

Travel Nursing

Nurse Practitioner

Other relevant specialties

The system must ask intelligent follow-up questions rather than making unsupported assumptions.

The specialization engine should generate a structured career specialization profile that influences:

job discovery

terminology

skill matching

qualification matching

job scoring

recommendations

career-gap analysis

interview questions

application optimization

career progression recommendations

The architecture should allow many professional domains without creating a separate codebase for each profession.

6. Intelligent Onboarding

Create an onboarding flow that feels like an intelligent career interview.

Do not ask the user 50 boring form questions at once.

Use progressive, context-aware questions.

The onboarding should establish:

Career/field

Specialization

Career stage

Experience

Education

Skills

Certifications

Projects

Target roles

Industry preferences

Location

Salary expectations

Remote/hybrid/on-site preference

Relocation preference

Career goals

Constraints

Allow users to upload a resume.

The AI should extract structured career data from the resume and ask follow-up questions where confidence is low or information is missing.

The user must be able to review and edit everything the AI extracted.

Never silently save inaccurate AI assumptions.

7. AI Career Profile

After onboarding, create a persistent AI-readable Career Profile.

This is not just a resume.

It represents:

who the candidate is

what they can do

where they want to go

what constraints they have

what opportunities fit them

what skills they are missing

what career trajectory they appear to be pursuing

The profile should continually improve as the user adds applications, interviews, outcomes, skills, projects, and preferences.

8. Job Discovery Architecture

Create a provider-agnostic Job Discovery Layer.

Do NOT hard-code the application to one job board.

The system should eventually support multiple legitimate job data sources.

Normalize incoming jobs into the internal Jobs schema.

Required capabilities:

ingestion

normalization

deduplication

freshness

source tracking

job status

location normalization

skill extraction

qualification extraction

seniority extraction

compensation extraction

industry extraction

application URL tracking

Design this so additional job providers can be added later with minimal architectural changes.

9. Career Matching Engine

Build the foundation for deterministic candidate/job matching.

Calculate structured scores such as:

skills match

experience match

education match

certification match

location match

compensation match

seniority match

industry match

career-goal match

preference match

Do not simply ask an AI model:

"Is this job good?"

Instead build structured evidence first.

The AI then interprets the structured evidence.

10. AI Job Ranking

Create an AI reasoning layer that can evaluate the structured candidate/job data.

Every job should eventually receive a score such as:

94/100

and an explanation:

WHY IT MATCHES

strong skill alignment

appropriate seniority

strong industry fit

location compatible

strong career progression potential

POTENTIAL CONCERNS

employer requests experience slightly above user's current experience

GAPS

missing qualification X

RECOMMENDATION

Apply Immediately

Apply

Consider

Low Priority

Skip

The AI must explain its recommendation using evidence from the candidate profile and job description.

Never fabricate evidence.

11. Priority Queue

The user should not merely see a list of jobs.

Create:

Top Opportunities

Rank jobs based on fit, quality, career value, preferences, and urgency.

For every recommendation display:

ranking

score

company

role

location

salary when available

why it matches

concerns

recommendation

suggested next action

Example:

#1
94/100
Strong Match
Apply Today

#2
89/100
Excellent Match
Apply This Week

#3
84/100
Good Match
Apply If Willing To Relocate

This should become a central feature of the dashboard.

12. Career Trajectory Intelligence

The AI should eventually understand where the candidate wants to go.

Example:

Target:
FPGA Engineer

The AI identifies possible adjacent entry points:

Digital Design Engineer

Hardware Engineer

Verification Engineer

Embedded Engineer

Then it can explain which positions are useful stepping stones.

The system should identify:

skill gaps

experience gaps

certification gaps

project gaps

role progression opportunities

The goal is not simply "get a job."

The goal is:
"Get the right next job for the user's career trajectory."

13. Application Intelligence

When a user decides to pursue a job, provide an application workspace.

The workspace should know:

user career profile

selected job

match analysis

skill match

gaps

relevant experience

target role

company

Actions:

Optimize Resume
Generate Cover Letter
Generate Recruiter Message
Build Application Strategy
Prepare Interview
Track Application

Resume optimization must never invent experience.

14. Interview Intelligence

For each interview-capable application provide:

likely behavioral questions

likely technical questions

company-specific preparation

role-specific questions

candidate weak areas

suggested questions to ask interviewer

STAR preparation

mock interview

Mock interviews should be interactive.

After an interview session evaluate:

relevance

specificity

structure

communication

evidence

conciseness

role alignment

Then provide actionable improvement feedback.

15. Application CRM

Provide:

Kanban pipeline:

Saved
Applied
Recruiter
Interview
Final Round
Offer
Rejected
Withdrawn

Allow drag-and-drop movement where appropriate.

Applications should retain:

documents

notes

communications

interview sessions

follow-up tasks

analytics

16. Follow-Up Intelligence

The system should identify follow-up opportunities.

Examples:

"You applied 7 days ago and have no recorded response."

"Interview completed 2 days ago. Consider sending a thank-you message."

"Recruiter requested information."

Generate context-aware follow-up communications.

17. Search Analytics

Create a career-search analytics system.

Metrics:

total applications

response rate

interview rate

final-round rate

offer rate

average days to response

strongest job categories

strongest industries

strongest locations

strongest resume version

strongest job-match range

The AI should interpret these metrics.

Example:

"Your strongest conversion rate occurs for embedded systems roles between 80–90% match. Consider concentrating your search there."

18. Adaptive Career Agent

The long-term system should learn from behavior.

Examples:

If the user repeatedly rejects relocation:
remember that preference.

If the user prefers semiconductor jobs:
increase relevance of semiconductor jobs.

If the user receives significantly more interviews from embedded roles:
recognize that pattern.

If the user adds a new skill:
recalculate relevant opportunities.

If the user repeatedly fails interviews:
identify likely improvement areas.

The AI should adapt recommendations over time.

Do not make hidden decisions. Users should be able to understand and edit important preferences.

19. Dashboard

Design a premium modern dashboard.

Primary sections:

Dashboard
My Career
Find Opportunities
Top Matches
Applications
Interviews
Career Insights
Documents
Settings

Dashboard should emphasize:

Top Opportunities

Today's Recommended Actions

Application Funnel

Upcoming Interviews

Follow-ups

Career Insights

The product should feel like premium professional software, not a generic AI template.

20. Visual Design

Create a polished, restrained, high-end SaaS aesthetic.

Characteristics:

clean

professional

intelligent

modern

minimal

strong typography

excellent spacing

subtle motion

accessible contrast

responsive desktop/tablet/mobile layouts

Avoid:

excessive gradients

cartoonish illustrations

generic AI sparkles everywhere

clutter

excessive rounded cards

template-like appearance

The visual language should communicate:

"serious professional career intelligence."

21. AI UX

AI should appear naturally throughout the application.

Avoid making the product look like a chatbot with a website attached.

Use AI for:

analysis

ranking

recommendations

explanations

personalization

planning

interview coaching

career insights

A persistent AI assistant can exist later, but the main interface should expose intelligence contextually.

22. AI Architecture

Design an internal AI service abstraction.

Use specialized logical capabilities rather than one giant prompt.

Examples:

career_profile_agent
career_specialization_agent
resume_analysis_agent
job_analysis_agent
job_matching_agent
job_ranking_agent
application_strategy_agent
resume_optimization_agent
interview_preparation_agent
mock_interview_agent
career_analytics_agent
career_advisor_agent

These do not necessarily need to be separate deployed models initially.

They can be separate service modules/prompts with shared infrastructure.

Keep prompts/versioning structured and maintainable.

23. AI Reliability

AI output must be grounded in known data.

Where appropriate, provide the AI:

candidate structured profile

job structured profile

source text

explicit constraints

The system should distinguish:

verified facts

candidate-provided information

employer-provided information

AI inference

Do not present inference as fact.

24. Initial MVP

Build the architecture for the full product, but implement the first working vertical slice:

Authentication
↓
Career onboarding
↓
Career profile
↓
Resume upload
↓
Resume extraction
↓
Career specialization
↓
Job ingestion architecture
↓
Job matching
↓
Job ranking
↓
Top Opportunities dashboard

This must become a genuinely usable first version.

Do not build fake job recommendations with placeholder data disguised as real data.

When real external job data is not configured yet, clearly separate demo/test data from production job data.

25. Development Method

Work incrementally.

Do not generate the entire application in one uncontrolled change.

Before implementing a major subsystem:

understand existing architecture

identify affected files

make the smallest coherent implementation

test

fix errors

preserve existing functionality

Reuse components and services rather than duplicating logic.

Create clean boundaries between:

UI

application services

AI services

database operations

external integrations

26. Database Security

Use Row Level Security throughout Supabase.

Every private user-owned table must enforce ownership at the database level.

Do not rely exclusively on frontend checks.

Use appropriate server-side validation and authorization.

27. Future Expansion

The architecture must leave room for:

browser extension

mobile app

autonomous job discovery

email integration

calendar integration

LinkedIn-related workflows where permitted

interview scheduling

employer/company intelligence

salary intelligence

skill-gap learning recommendations

career-path simulation

team/career-coach plans

university plans

enterprise career services

MCP integration

AI assistant integrations

multiple AI providers

advanced analytics

Do not implement all of these now.

Design so they can be added later without rebuilding the core.

28. Immediate Task

Before implementing the complete product, do the following:

Initialize the project architecture.

Connect/create the Supabase backend.

Create the initial PostgreSQL schema.

Implement authentication.

Implement the application shell and navigation.

Implement the Career Profile data model.

Implement the intelligent career onboarding flow.

Implement resume upload/storage.

Build the foundation for resume parsing.

Build the Career Specialization Engine foundation.

Create the initial dashboard shell.

Establish reusable UI components.

Establish the AI service abstraction.

Establish secure server-side secret handling.

Keep the project ready for GitHub synchronization.

Do NOT attempt to build every future feature in this first step.

The immediate objective is to create a clean, production-oriented foundation that can support the full JobOS vision.

Before making major architectural decisions that could create long-term technical debt, explain the decision briefly and choose the approach that best preserves scalability, security, maintainability, and speed of future development.

At the end of this phase, verify that:

the application builds

authentication works

database connectivity works

user data is isolated

the onboarding flow works

the career profile persists

uploaded files are securely stored

the project has a clean component/service structure

no secrets are exposed client-side

there are no obvious console/runtime errors

The application should feel like the beginning of a serious commercial product, not a prototype.

Do not invent missing external integrations. Create clean interfaces/placeholders for integrations that require credentials or external services, and clearly identify what configuration is still required.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/8d8cf78b-83ce-492c-a278-ea26d5daf6ed).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
