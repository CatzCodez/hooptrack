4. In your Supabase project, create a table called `favorites` with these columns:
   - `id` — int8, primary key
   - `player_id` — int8
   - `player_name` — text
   - `team` — text
   - `position` — text
   - `height` — text
   - `weight` — text

5. Enable Row Level Security on the `favorites` table and add a policy that allows all operations for the `anon` role with `true` as both the USING and WITH CHECK expressions.

---

### Running the Application

To run the app locally:
```bash
node index.js
```

The app will be available at `http://localhost:3000`.

---

### Running Tests
There are currently no automated tests written for this project. Manual testing is recommended by visiting each page and verifying:
- Today's games load on the home page
- Recent games load on the home page
- Player search returns results
- Favorites can be added and removed
- Compare chart renders when two players are selected

---

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/games` | Fetches today's NBA games from BallDontLie API |
| GET | `/api/recent-games` | Fetches NBA games from the last 7 days from BallDontLie API |
| GET | `/api/players?search=name` | Searches for players by name from BallDontLie API |
| GET | `/api/favorites` | Retrieves all favorite players from Supabase |
| POST | `/api/favorites` | Saves a new favorite player to Supabase |
| DELETE | `/api/favorites/:id` | Removes a favorite player from Supabase by ID |

---

### Known Bugs
- All users currently share the same favorites list since there is no user authentication. Future development should add login functionality so each user has their own favorites.
- The BallDontLie free tier has a rate limit of 5 requests per minute. If the page is refreshed too quickly, API calls may fail temporarily.
- The compare chart only supports height and weight comparison since detailed player stats require a paid BallDontLie tier.

### Roadmap for Future Development
- Add user authentication so each user has their own favorites list
- Add team standings page
- Add player season stats with a paid BallDontLie tier
- Add playoff bracket visualization
- Add mobile responsive design