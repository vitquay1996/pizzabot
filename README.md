# Pizzabot
A basic facebook bot to sell pizza

# Instruction
Start tunnel to local host
```
./ngrok http 8445
```
In another terminal, add the environment variables
```
export FB_PAGE_ID=<your page id>
export FB_PAGE_TOKEN=<your page token>
export FB_VERIFY_TOKEN=<your webhook verify token>
```
Start server
```
node bot.js
```
