# Post creation flow

This is the agreed flow for creating a post on mobile and web. It keeps the existing
wizard structure and fixes validation, feedback and data-loss gaps without changing
the public API.

## Mobile (5 steps)

1. **Category** — choose a category and, where offered, a type/subtype.
2. **Details** — title, description, optional availability and up to 5 photos.
3. **Location** — detect GPS or pin a location on the map.
4. **Exchange** — price/budget, duration, urgent flag, barter flag and exchange preference.
5. **Review** — preview the post, then publish.

## Web (4 steps)

1. **Category** — choose a category.
2. **Details** — job/item category where relevant, title, description, price,
   duration, exchange preference, up to 5 photos and urgent flag.
3. **Location** — auto-detect or pin a location on the map.
4. **Review** — preview the post, then publish.

## Shared validation rules

Validation runs when the user advances a step and again before publishing.

- A category is required. Job posts need a job type; sell/rent posts need an item category.
- Title and description are required after trimming whitespace.
- Title is limited to 200 characters; description to 5000 (matching the server).
- Location requires exactly one source: current GPS or map pin. Switching options clears
  the previous coordinates and label, and the selected source is submitted with the post.
- Price, when provided, must be a non-negative number.
- A maximum of 5 JPEG/PNG/WebP photos is allowed, each up to 5 MB.

Errors are shown inline near the offending field (web) or in a visible banner above
the footer actions (mobile). The Publish action also re-runs the full validation in
case earlier data was changed before returning to review.

## Data compatibility

Existing fields and the `POST /api/posts` contract remain unchanged. `subType` and
`jobType` were previously accepted from clients but dropped by Mongoose; they are now
optional persisted fields so reviewed data matches the saved post.
