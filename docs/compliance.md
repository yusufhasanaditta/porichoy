# LinkedIn compliance

LinkedIn does not permit "browser extensions that scrape, modify the appearance of, or automate activity on LinkedIn's website". There is no open API for editing a member's profile. Porichoy is designed around this.

| Feature | Do | Don't |
|---|---|---|
| LinkedIn input (default) | User uploads their own "Save to PDF" export or pastes their own text | Fetch linkedin.com from the server |
| Extension "Read this page" (opt-in) | Only on click, only the active tab, only the user's own profile, preview before sending | Background reading, auto-scroll, other people's profiles, storing raw HTML |
| Applying edits | Copy button + which section to open; the user pastes and saves | Typing into LinkedIn fields or clicking Save |
| Posting | User clicks Publish → official Share on LinkedIn API (`w_member_social`) | Scheduled auto-posting, auto likes/comments |

The full demo also works in the web app without the extension.
