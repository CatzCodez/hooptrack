const express = require('express');
const supabaseClient = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static(__dirname + '/public'));

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = supabaseClient.createClient(supabaseUrl, supabaseKey);
const bdlKey = process.env.BALLDONTLIE_KEY;

app.get('/', (req, res) => {
    res.sendFile('public/index.html', { root: __dirname });
});

app.get('/players', (req, res) => {
    res.sendFile('public/players.html', { root: __dirname });
});

app.get('/about', (req, res) => {
    res.sendFile('public/about.html', { root: __dirname });
});

// API 1: Get today's games from BallDontLie
app.get('/api/games', async (req, res) => {
    const today = new Date().toLocaleDateString('en-CA');
    const response = await fetch(
        `https://api.balldontlie.io/v1/games?dates[]=${today}`,
        { headers: { Authorization: bdlKey } },
    );
    if (!response.ok) {
        return res
            .status(429)
            .json({ error: 'Rate limited, try again in a minute' });
    }
    const data = await response.json();
    res.json(data);
});

// API 2: Get recent games from BallDontLie
app.get('/api/recent-games', async (req, res) => {
    const today = new Date();
    const yesterday = new Date();
    const sevenDaysAgo = new Date();
    yesterday.setDate(today.getDate() - 1);
    sevenDaysAgo.setDate(today.getDate() - 7);
    const yesterdayStr = yesterday.toLocaleDateString('en-CA');
    const sevenDaysAgoStr = sevenDaysAgo.toLocaleDateString('en-CA');
    const response = await fetch(
        `https://api.balldontlie.io/v1/games?start_date=${sevenDaysAgoStr}&end_date=${yesterdayStr}&per_page=25`,
        { headers: { Authorization: bdlKey } },
    );
    if (!response.ok) {
        return res
            .status(429)
            .json({ error: 'Rate limited, try again in a minute' });
    }
    const data = await response.json();
    res.json(data);
});

// API 3: Search players from BallDontLie
app.get('/api/players', async (req, res) => {
    const search = req.query.search || '';
    const response = await fetch(
        `https://api.balldontlie.io/v1/players?search=${search}&per_page=10`,
        { headers: { Authorization: bdlKey } },
    );
    if (!response.ok) {
        return res
            .status(429)
            .json({ error: 'Rate limited, try again in a minute' });
    }
    const data = await response.json();
    res.json(data);
});

// API 4: Get favorites from Supabase
app.get('/api/favorites', async (req, res) => {
    const { data, error } = await supabase.from('favorites').select();
    if (error) {
        res.status(500).json({ error });
    } else {
        res.json(data);
    }
});

// API 5: Save a favorite to Supabase
app.post('/api/favorites', async (req, res) => {
    const { player_id, player_name, team, position, height, weight } = req.body;
    console.log('Adding favorite:', player_id, player_name, team);

    const { data: existing } = await supabase
        .from('favorites')
        .select()
        .eq('player_id', player_id);

    if (existing && existing.length > 0) {
        return res.status(400).json({ message: 'Player already in favorites' });
    }

    const { data, error } = await supabase
        .from('favorites')
        .insert({ player_id, player_name, team, position, height, weight })
        .select();

    if (error) {
        console.log('Supabase error:', JSON.stringify(error));
        res.status(500).json({ error });
    } else {
        res.json(data);
    }
});

app.delete('/api/favorites/:id', async (req, res) => {
    const id = req.params.id;
    const { error } = await supabase.from('favorites').delete().eq('id', id);
    if (error) {
        res.status(500).json({ error });
    } else {
        res.json({ message: 'Deleted' });
    }
});

app.listen(port, () => {
    console.log(`App is available on port: ${port}`);
});