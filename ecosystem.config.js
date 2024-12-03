module.exports = {
    apps: [
        {
            name: "seace",
            script: "./dist/main.js",
            env: {
                NODE_ENV: "production",
            },
        }
    ]
}