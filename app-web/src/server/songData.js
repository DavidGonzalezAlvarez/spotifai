const express = require('express');
const request = require('request');

const router = express.Router();

router.use("/get/songInfo", (req, res) => {
    const access_token = req.cookies.access_token;

    if (!req.query.songName) {
        console.error("Petición inválida: faltan parámetros");
        return res.status(400).send("Faltan parámetros");
    }

    const options = {
        url: `https://api.spotify.com/v1/search?q=track%3A${req.query.songName}&type=track`,
        headers: { 'Authorization': 'Bearer '+ access_token} 
    }
    request.get(options, function(error, response, body) {
        if (!error && response.statusCode === 200) {
            res.status(200).json({ tracks: body });
        } else {
            console.log("ERROR");
            res.status(404).send("Error fetching top tracks");
        }
    });
})

module.exports = router;