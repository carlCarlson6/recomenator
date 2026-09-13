lets build a new app

i want to build an app for friends to share recomendations about:
video games, moview, shows, music, miscellaneous

for the moment a prefixated list

user will be able to create a group and generate an invitation link, groups are private without invitation

inside the groups users will be able to create a post with the recomentation under one of the existing categories, 
the post will include a title, options description, a link to the source if ncessesary

users will see the list of recomendations of other members of the groups on a timeline style, on that view the users will be also able to filter the recomendations by category 

users will be able to replay to a post to generate conversations and discussions

lets make an implemantation plan for the first version
use the following technologies:
- tanstack start
- drizzle
- postgress
- neon (db hosting)
- clerk (auth)
- vercel (hosting)

/grill-me

################################################
################################################

here my responses to the questions:
q1  - for the moment only those ones
q2  - expering but with long time, multiple uses so various persons can join the group
q3  - exactly
q4  - use for the moment social
q5  - take name provided by deafault for clerk, users will be able to set they own display name for each group
q6  - optional
q7  - if we can display it from the provided link try it, like render a image, a youtube embedded, a spotify embedded
q8  - for the moment hardcoded, maybe in the future we move to db
q9  - most recent post first, no bumbinp, maybe on the future you can access to post where you have replaied
q10 - flat replies
q11 - in app indicator
q12 - what constrains can i face? if server functions does not work okay we can just use api endpoints right?
q13 - for development local postgress, prepare a script to launch the local db
q14 - no, just refresh
q15 - for teh moment lest go with minimal custom tailwind
q16 - yes make it mobile first
q17 - prod + previes
q18 - yes

-----------------

on another topic:
i forget to mention before, follow and architectural style of the app using the concepts of:
- domain driven design
- hexagonal architecture
- vertical slicing

################################################
################################################

my notes for the last decissions:
1 - yes
2 - yes
3 - yes
4 - keep all the tables on schema for the moment
5 - no moderation
6 - okay
7 - okay

################################################
################################################

npx skills add https://github.com/ccheney/robust-skills --skill clean-ddd-hexagonal
npx skills add https://github.com/codewithmukesh/dotnet-claude-kit --skill ddd
npx skills add https://github.com/codewithmukesh/dotnet-claude-kit --skill vertical-slice
npx skills add https://github.com/affaan-m/ecc --skill hexagonal-architecture
npx skills add https://github.com/wshobson/agents --skill typescript-advanced-types
npx skills add https://github.com/obra/superpowers --skill test-driven-development
npx skills add https://github.com/wshobson/agents --skill tailwind-design-system
npx skills add https://github.com/vercel-labs/agent-skills --skill vercel-react-best-practices
npx skills add https://github.com/lobehub/lobehub --skill drizzle

npx skills add https://github.com/neondatabase/agent-skills --skill neon-postgres
npx skills add https://github.com/tanstack-skills/tanstack-skills --skill tanstack-start
npx skills add https://github.com/deckardger/tanstack-agent-skills --skill tanstack-start-best-practices
npx skills add https://github.com/deckardger/tanstack-agent-skills --skill tanstack-query-best-practices
npx skills add https://github.com/clerk/skills --skill clerk-tanstack-patterns

################################################
################################################

to the technologies add T3 Env - https://env.t3.gg/docs/core
to validate that the app has all the env variales to checkl it when start app

----

the decisions to confirm:
1 - yes
2 - ok
3 - ok
4 - ok, make sure to put test on a test/ folder on the root of the repo, at the same level as src
5 - yes