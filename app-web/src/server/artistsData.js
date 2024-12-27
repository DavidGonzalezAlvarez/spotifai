const express = require('express');
const request = require('request');

const router = express.Router();

router.use("/get/artists/topTracks", (req, res) => {
    const access_token = req.cookies.access_token;

    if (!req.query.id || !req.query.name) {
        console.error("Petición inválida: faltan parámetros");
        return res.status(400).send("Faltan parámetros");
    }

    const options = {
        url: `https://api.spotify.com/v1/artists/${req.query.id}/top-tracks`,
        headers: { 'Authorization': 'Bearer '+ access_token} 
    }
    request.get(options, function(error, response, body) {
        if (!error && response.statusCode === 200) {
            res.status(200).json({ topTracks: body });
        } else {
            console.log("ERROR");
            res.status(404).send("Error fetching top tracks");
        }
    });
});

module.exports = router;
