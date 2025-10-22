# Doctor Frontend Application

A modern Next.js frontend application for doctors to manage appointments, prescriptions, and shifts.

## Prerequisites

- Node.js (v18 or higher)
- npm (comes with Node.js)

## Installation

Follow these steps to set up and run the application:

### 1. Create `.env` File

Create a `.env` file in the root directory with the necessary environment variables:

```bash
# Example environment variables
NEXT_PUBLIC_API_URL=http://localhost:3001
```

You can copy from `.env.example` if available, or create your own based on your configuration needs.

### 2. Install pnpm (if not already installed)

Install pnpm globally using npm:

```bash
npm install -g pnpm
```

To verify the installation:

```bash
pnpm --version
```

### 3. Install Dependencies

Install all project dependencies using pnpm:

```bash
pnpm i
```

This will install all packages listed in `package.json` and create a `pnpm-lock.yaml` file.

### 4. Build the Project

Build the Next.js application for production:

```bash
pnpm build
```

### 5. Start the Application

Start the production server:

```bash
pnpm start
```

The application will be available at `http://localhost:3000` by default.

## Development

To run the application in development mode with hot reloading:

```bash
pnpm dev
```

The development server will typically run on `http://localhost:3001`


## Troubleshooting

### pnpm command not found

If you get a "pnpm command not found" error, ensure pnpm is installed globally:

```bash
npm install -g pnpm
```

### Port already in use

If port 3000 or 3001 is already in use, you can specify a different port:

```bash
# Development
pnpm dev -- -p 3002

# Production
pnpm start -- -p 3002
```

### Clear cache

If you encounter issues, try clearing Next.js cache:

```bash
rm -r .next
pnpm i
pnpm build
```

## Contribution
  1. นพณัช สาทิพย์พงษ์ besterOz
  2. พงศธร รักงาน prukngan
  3. ภวัต เลิศตระกูลชัย Phawat Loedtrakunchai
  4. ธฤต จันทร์ดี tharitpr


