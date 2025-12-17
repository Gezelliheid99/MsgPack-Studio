# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Docker Support

### Build the Image

To build the Docker image, run the following command. You need to provide your Gemini API key as a build argument:

```bash
docker build --build-arg GEMINI_API_KEY=your_api_key_here -t msgpack-studio .
```

### Run the Container

Run the container mapping port 8080 to the container's port 80:

```bash
docker run -d -p 8080:80 --name msgpack-studio msgpack-studio
```

Access the application at [http://localhost:8080](http://localhost:8080).
