# Libibi 📚

## Introduction

Libibi is a modern web application designed for book enthusiasts to track their reading journey and discover new books. The idea originated from the fact that both contributors are passionate readers who couldn't find a convenient, user-friendly solution with a modern design on the market to keep track of their read books and discover new ones.

### Project Background

This web application was born as a university project for an Internet Technologies course. After successfully completing two previous website projects, we decided to increase the challenge by giving ourselves a two-week deadline to develop a fully functional book management platform.

### Architecture

A monolithic architecture was chosen for this project due to:
- The relatively small size of the application
- Full support from the chosen frameworks (Next.js and Prisma)
- Simplified deployment and maintenance for a project of this scale

The monolithic approach allowed us to rapidly develop and iterate on the application while maintaining code cohesion and simplicity.

## Features

- 📖 **Book Tracking**: Keep track of books you've read, are currently reading, or want to read
- 🔍 **Book Discovery**: Search and discover new books from the Open Library API
- ⭐ **Reviews**: Write and read reviews for books
- 👤 **User Profiles**: Personalized reading profiles
- 🤖 **AI Recommendations**: Get personalized book recommendations based on your reading history
- 📚 **Personal Library**: Organize your books into custom shelves

## Tech Stack

### Frontend & Backend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **React** - UI components

### Database & ORM
- **Prisma** - Next-generation ORM
- **PostgreSQL/SQLite** - Database (configurable)

### Styling
- **Tailwind CSS** - Utility-first CSS framework
- **PostCSS** - CSS processing

### External APIs
- **Open Library API** - Book data and metadata
- **AI Services** - For personalized recommendations

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Database (PostgreSQL or SQLite)

### Installation

1. Clone the repository
```bash
git clone https://github.com/Fedefilice/Libibi.git
cd Libibi/libibi
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
Create a `.env.local` file in the root directory:
```env
DATABASE_URL="your_database_url"
# Add other required environment variables
```

4. Run database migrations
```bash
npx prisma migrate dev
```

5. Generate Prisma Client
```bash
npx prisma generate
```

6. Start the development server
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Project Structure

```
libibi/
├── lib/                  # Utility functions and shared logic
├── prisma/              # Database schema and migrations
├── public/              # Static assets
├── src/
│   ├── app/            # Next.js App Router pages and layouts
│   │   ├── (data)/     # Data-focused routes (books, authors)
│   │   ├── (user)/     # User-focused routes (profile, login)
│   │   └── api/        # API routes
│   ├── components/     # Reusable React components
│   ├── hooks/          # Custom React hooks
│   ├── services/       # Business logic and external services
│   └── types/          # TypeScript type definitions
└── ...config files
```

## Database Schema

The application uses Prisma as an ORM with the following main entities:
- **Users** - User accounts and authentication
- **Books** - Book information and metadata
- **Reviews** - User reviews and ratings
- **Shelves** - Custom book collections
- **Authors** - Author information

## API Routes

- `/api/users/*` - User management and authentication
- `/api/book/*` - Book operations and details
- `/api/author/*` - Author information
- `/api/review/*` - Review management
- `/api/search/*` - Book search functionality
- `/api/recommended/*` - AI-powered recommendations

## Development

### Running Tests
```bash
npm test
```

### Linting
```bash
npm run lint
```

### Build for Production
```bash
npm run build
```

## Contributing

This project was developed by:
- [Fedefilice](https://github.com/Fedefilice)
- [Asta22403] (https://github.com/Asta22403)

As this is a university project, contributions are currently limited to the original team members.

## License

This project is part of a university course and is intended for educational purposes.

## Acknowledgments

- Open Library API for providing comprehensive book data
- University of Parma - Internet Technologies Course
- All the open-source libraries and tools that made this project possible

---

*Developed with ❤️ by passionate readers, for passionate readers.*
