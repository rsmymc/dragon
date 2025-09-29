# Dragon Boat Team Management System

A full-stack web application for managing dragon boat teams, players, training sessions, and lineups.

## Tech Stack

### Backend
- **Django 5.x** - Python web framework
- **Django REST Framework** - API development
- **PostgreSQL 16** - Database
- **Docker** - Containerization

### Frontend
- **Vue.js 3** - JavaScript framework
- **Vite** - Build tool and dev server

## Features

### Data Models
- **Teams** - Sports teams with locations and members
- **People** - Player profiles with physical attributes and preferences
- **Memberships** - Role-based team assignments (Player, Captain, Coach, Manager)
- **Locations** - Training venues with GPS coordinates
- **Trainings** - Scheduled practice sessions
- **Lineups** - Seating arrangements for training sessions

### API Endpoints
- RESTful API built with Django REST Framework
- JWT authentication
- CORS enabled for frontend communication
- API documentation with drf-spectacular

## Getting Started

### Prerequisites
- Docker Desktop
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd dragon
   ```
2. **Setup environment**
   ```bash
   # Make the link script executable
   chmod +x link-env.sh
   
   # Link to development environment
   ./link-env.sh dev
    ```
3. **Start the application**
   ```bash
   # Development
   docker-compose -f docker-compose.dev.yml up --build
   
   # Production
   ./link-env.sh prod
   docker-compose -f docker-compose.prod.yml up --build
   ```

3. **Access the application**
    - **Frontend**: http://localhost:5173 (dev) or http://localhost (prod)
    - **Backend API**: http://localhost:8000
    - **Django Admin**: http://localhost:8000/admin
    - **PgAdmin**: http://localhost:5050

### Default Credentials
- **Django Admin**: `test_user` / `test_user1234`
- **PgAdmin**: `admin@example.com` / `admin`

## Sample Data

The application comes with fixture data including:
- 3 teams (Dragons FC, Phoenix United, Lightning Bolts)
- Sample players with varying attributes
- Training locations in New York, Phoenix, and Miami
- Scheduled training sessions
- Example lineups and seating arrangement

#

## Demo Video
<video width="600" controls>
  <source src="demo.mp4" type="video/mp4">
  Your browser does not support the video tag.
</video>