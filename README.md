# Agro Datasets Platform

A web platform for organizing, reviewing, and exporting agricultural image datasets. This project is my undergraduate thesis, developed as part of the requirements for a degree in Systems Engineering.

The platform brings dataset management and image-related metadata into one application. It combines an Angular client with a NestJS REST API and MongoDB persistence.

## Project objectives

- Provide a centralized way to create, browse, and manage agricultural datasets.
- Support image uploads and associate image records with dataset metadata.
- Process dataset archives containing images and optional CSV annotations.
- Extract available image capture dates from EXIF metadata.
- Import annotation data from CSV and export datasets as ZIP archives with metadata.
- Provide authenticated access to selected dataset operations.

## Features

- Dataset creation, listing, detail views, and status updates.
- Image uploads and dataset archive processing.
- CSV metadata and annotation import, including per-row processing feedback.
- EXIF capture-date extraction with a file-time fallback when original EXIF dates are unavailable.
- ZIP export containing available images and a generated metadata CSV.
- JWT-based login and protected upload operations.
- Storage usage statistics endpoint.

## Technology stack

| Area | Technologies |
| --- | --- |
| Frontend | Angular 18, TypeScript, Tailwind CSS, SweetAlert2 |
| Backend | NestJS 11, Node.js, TypeScript |
| Database | MongoDB with Mongoose |
| Authentication | Passport and JWT |
| Data processing | CSV parsing, EXIF metadata extraction, ZIP archive utilities |
| Testing | Jest (backend), Angular CLI test tooling (frontend) |

## Architecture

The repository contains two independently installed applications:

- `frontend/` — Angular single-page application.
- `backend/` — NestJS REST API, MongoDB integration, authentication, and dataset processing.

The backend serves the API on port `3000` by default and the Angular development server uses port `4200`. The backend's current CORS configuration allows the local frontend origin `http://localhost:4200`.

## Prerequisites

- Node.js 20 or later.
- npm.
- A MongoDB instance, local or hosted.

## Getting started

### 1. Clone the repository

```bash
git clone https://github.com/Johngardev/project-platform-agrodatasets.git
cd project-platform-agrodatasets
```

### 2. Configure the backend

Create `backend/.env` and set the MongoDB connection string:

```env
MONGO_URI=mongodb://127.0.0.1:27017/agro_datasets
```

Use the connection string for your own MongoDB deployment if it is not running locally. The backend reads its configuration through NestJS `ConfigModule`.

### 3. Install dependencies

In one terminal:

```bash
cd backend
npm install
```

In another terminal, from the repository root:

```bash
cd frontend
npm install
```

### 4. Run the applications

Start the API in the backend terminal:

```bash
cd backend
npm run start:dev
```

Start the frontend in the frontend terminal:

```bash
cd frontend
npm start
```

Open [http://localhost:4200](http://localhost:4200) in a browser. The API listens on port `3000` unless `PORT` is set.

## Useful commands

### Backend

Run these commands from `backend/`:

```bash
npm run build       # Compile the API
npm run start:dev   # Run in watch mode
npm run test        # Run unit tests
npm run test:e2e    # Run end-to-end tests
npm run test:cov    # Generate test coverage
```

### Frontend

Run these commands from `frontend/`:

```bash
npm start           # Start the Angular development server
npm run build       # Build the frontend
npm test            # Run frontend tests
```

## Dataset processing

The backend supports processing ZIP uploads with image files and an optional CSV file. The processing flow reads supported image files, associates CSV metadata and annotations when available, and extracts capture-date metadata from EXIF where possible.

For annotation imports, the backend expects the following CSV header:

```text
filename,ripeness_degree,width,height,spectral_r,spectral_g,spectral_b,spectral_nir,annotations_json
```

ZIP exports include the images that are available on disk and a generated `metadata.csv` file. The exact files included depend on the dataset contents.

## Repository structure

```text
.
├── backend/   # NestJS API, authentication, database models, and data processing
└── frontend/  # Angular web application
```

## Academic context

This repository documents and implements my undergraduate thesis project for the Systems Engineering degree. It applies software engineering concepts to the organization and processing of agricultural image datasets. The system is intended to support dataset workflows through a web interface and a modular API.

## Current scope and limitations

This README describes the functionality implemented in the repository. Deployment configuration, production security hardening, and operational requirements should be evaluated separately before using the application with sensitive data or in a production environment.

## Author

**John Garcia** — Systems Engineering undergraduate thesis project.

For questions, bug reports, or suggestions, please open an issue in this repository.
