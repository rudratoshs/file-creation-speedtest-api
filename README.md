# Internet Speed Test File Server

This repository provides a file-serving backend for an internet speed test tool using Express. It is designed to dynamically generate and serve files for download/upload speed testing. This backend can be deployed as a serverless function on Netlify or self-hosted on a platform like AWS.

## Project Structure

```
README.md               # Project documentation.
dist/                   # Contains frontend files (e.g., `index.html`).
files/                  # Directory to store generated files.
functions/              # Contains server-side API code.
  └── api.js            # Main Express server logic.
netlify.toml            # Netlify configuration file.
package.json            # Node.js dependencies and scripts.
package-lock.json       # Lockfile for Node.js dependencies.
```

## Features

- **Dynamically Generated Files**: If a file is requested and doesn't exist, it is automatically created based on the file name (e.g., `128KB.bin` will generate a 128 KB file).
- **Download and Upload Testing**: Serve dynamically generated files for download/upload speed testing.
- **Demo Endpoint**: A sample API endpoint (`/demo`) returns a list of user data.
- **Cross-Origin Resource Sharing (CORS)**: Enabled to allow requests from different origins.
- **Netlify Integration**: Uses `serverless-http` to run as a serverless function on Netlify.

## Prerequisites

- **Node.js**: Make sure Node.js is installed on your local machine.
- **Netlify CLI** (for Netlify deployment): Install using:
  ```bash
  npm install -g netlify-cli
  ```

## Getting Started

### 1. Install Dependencies

Clone the repository and install the required Node.js dependencies:

```bash
git clone https://github.com/yourusername/your-repo.git
cd your-repo
npm install
```

### 2. Run Locally

To run the server locally for testing:

```bash
netlify dev
```

This command will start the server using Netlify's local development environment, making the API available at `http://localhost:8888/.netlify/functions/api`.

### 3. Test API Endpoints

- **Demo API**: Visit `http://localhost:8888/.netlify/functions/api/demo` to see sample user data.
- **Download File**: Visit `http://localhost:8888/.netlify/functions/api/files/128KB.bin` to test file download.

## Deployment on Netlify

1. **Install Netlify CLI** (if not already done):

   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify**:

   ```bash
   netlify login
   ```

3. **Deploy the Project**:

   ```bash
   netlify deploy
   ```

4. **Deploy to Production**:

   ```bash
   netlify deploy --prod
   ```

   After deploying, you’ll receive a URL where your API can be accessed (e.g., `https://your-site-name.netlify.app`).

## Self-Hosting on AWS

To host this on a self-hosted platform like AWS, follow the steps below:

### Option 1: Using EC2

1. **Create an EC2 Instance**:
   - Launch an Amazon EC2 instance from the AWS Management Console.
   - Choose an OS (e.g., Ubuntu).
   - Configure security groups to allow HTTP/HTTPS traffic (ports 80 and 443).

2. **Connect to Your EC2 Instance**:

   ```bash
   ssh -i "your-key.pem" ubuntu@your-ec2-ip
   ```

3. **Install Node.js on EC2**:

   ```bash
   sudo apt update
   sudo apt install nodejs npm -y
   ```

4. **Clone the Repository on EC2**:

   ```bash
   git clone https://github.com/yourusername/your-repo.git
   cd your-repo
   ```

5. **Install Dependencies**:

   ```bash
   npm install
   ```

6. **Start the Server**:

   ```bash
   node functions/api.js
   ```

   The server will run on `http://localhost:3001` by default.

7. **Keep the Server Running**:
   Use `pm2` to keep the server running in the background:

   ```bash
   npm install -g pm2
   pm2 start functions/api.js
   pm2 save
   pm2 startup
   ```

8. **Access the Server**:
   Visit `http://your-ec2-ip:3001` to access your API.

### Option 2: Using AWS Elastic Beanstalk

1. **Initialize Elastic Beanstalk**:

   ```bash
   eb init -p node.js your-app-name
   ```

2. **Deploy to Elastic Beanstalk**:

   ```bash
   eb create your-environment-name
   eb deploy
   ```

   AWS will create an environment and URL where your server can be accessed.

## Configuration

### Environment Variables

If you have sensitive configurations like `SOCKET_URL`, you can store them in a `.env` file in the root directory:

```
SOCKET_URL=http://localhost:3001
PORT=3001
```

To use environment variables in your code, you can access them using `process.env.VARIABLE_NAME`.

### Netlify Configuration

In your `netlify.toml`, ensure the following configuration:

```toml
[build]
  functions = "functions"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/api/:splat"
  status = 200
```

This configuration directs all requests to `/api` to the serverless function.

## Common Issues

- **Missing `files` Directory**: Ensure that the `files` directory exists in the root folder to store generated files. If it doesn't, create it manually:
  ```bash
  mkdir files
  ```

- **Serverless Errors**: If you encounter issues with Netlify's serverless functions, make sure the file paths are correct and check the Netlify logs for more information.

## Contributing

1. Fork the repository.
2. Create a new branch (`git checkout -b feature-branch`).
3. Make your changes and commit (`git commit -m 'Add new feature'`).
4. Push to the branch (`git push origin feature-branch`).
5. Create a pull request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.