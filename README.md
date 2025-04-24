# Comstock Parquet Merge

This project demonstrates how to fetch ComStock parquet column data from S3 directly in the browser, parse these files (regardless of the compression method used), concatenate them, and download the results as a csv file.

It leverages modern web technologies including Bun and Vite for fast development and build processes, and uses Preact for a lightweight UI layer with TailwindCSS for styling.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Updating the ComStock Jekyll site](#updating-the-comstock-jekyll-site)

## Installation

1. Ensure you have [Bun](https://bun.sh/docs/installation) installed on your machine.
2. Clone the repository:
   ```bash
   git clone git@github.com:NREL/ComStock-parquet-merge.git
   ```
3. Navigate into the project directory:
   ```bash
   cd comstock-parquet-merge
   ```
4. Install the dependencies using bun:
   ```bash
   bun install
   ```

## Usage

After installation, you can use the following commands to develop and build the project:

- **Development Mode**: Start the development server with hot module replacement.
  ```bash
  bun run dev
  ```
- **Build for Production**: Create an optimized production build.
  ```bash
  bun run build
  ```
- **Preview Production Build**: Preview the production build locally.
  ```bash
  bun run preview
  ```
- **Format Code**: Use Prettier to format `index.html` and files in the `src` directory.
  ```bash
  bun run prettier
  ```

## Updating the ComStock Jekyll site

Run the build step to create the optimized `dist/parquet-merge-{hash}.js` output file, then copy that file to `assets/js/*` in the [ComStock.github.io](https://github.com/NREL/ComStock.github.io) repo. **Be sure to delete the previous file.**
