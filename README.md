# Supply Chain Dashboard - Frontend

A modern Next.js frontend for the Supply Chain Intelligence Dashboard with advanced analytics and data visualization.

## Features

- **Next.js 15**: Latest React framework with App Router
- **TypeScript**: Full type safety throughout the application
- **Tailwind CSS**: Utility-first styling with custom design system
- **shadcn/ui**: High-quality, accessible UI components
- **Recharts**: Interactive data visualization library
- **Real-time Data**: Live updates from FastAPI backend

## Architecture

```
frontend/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout with providers
│   ├── page.tsx           # Main dashboard page
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── dashboard-header.tsx
│   ├── metrics-cards.tsx
│   ├── trending-charts.tsx
│   ├── segmentation-matrix.tsx
│   └── recommendations-section.tsx
├── lib/                   # Utilities and contexts
│   ├── api-client.ts     # Backend API client
│   ├── data-context.tsx  # Global data state
│   ├── currency-context.tsx
│   └── utils.ts
├── hooks/                 # Custom React hooks
└── public/               # Static assets and local data
```

## Key Components

### Dashboard Header
- Navigation and branding
- Data source switching (Cloud/Local)
- S3 folder selection and upload
- Theme toggle (dark/light mode)

### Metrics Cards
- Key performance indicators
- Real-time data updates
- Currency formatting
- Responsive grid layout

### Trending Charts
- Interactive data visualizations
- Multiple view modes (chart/table/segmentation)
- Advanced filtering options
- Export capabilities

### Segmentation Matrix
- ABC-XYZ analysis grid
- Interactive segment selection
- Detailed segment modals
- Color-coded performance indicators

### Recommendations Section
- AI-driven insights
- Actionable recommendations
- Priority-based sorting
- Implementation tracking

## Setup

### 1. Install Dependencies
```bash
npm install --legacy-peer-deps
```

### 2. Configure Environment
Create `.env.local`:
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 3. Run Development Server
```bash
npm run dev
```
Application runs on: http://localhost:3000

## Data Management

### Context Providers
- **DataProvider**: Global data state management
- **CurrencyProvider**: Multi-currency support
- **ThemeProvider**: Dark/light mode theming

### API Integration
- Clean separation from backend
- Error handling and loading states
- Real-time data synchronization
- File upload progress tracking

## Data Sources & File Structure

### Required CSV Files
The application requires exactly 6 CSV files:

#### 1. `metrics.csv` - Key Performance Indicators
```csv
metric_id,metric_name,unit_value,financial_value
demand,Total Demand,150000,2250000
supply,Total Supply,145000,2175000
inventory,Current Inventory,25000,375000
```

#### 2. `measures.csv` - Time Series Data (20 weeks)
```csv
measure_id,measure_name,product_id,location_id,w1,w2,...,w20
demand_unit_value,Demand Units,P001,DC1,1200,1150,...,1300
demand_financial_value,Demand Value,P001,DC1,18000,17250,...,19500
```

#### 3. `products.csv` - Product Family Mappings
```csv
product_family,product_id
Electronics,P001
Electronics,P002
Clothing,P003
```

#### 4. `recommendations.csv` - System Recommendations
```csv
id,source,name,type,severity,status,action_status,start_date,completion_date,created_date
R001,recommendation,Increase Safety Stock,inventory,high,open,scheduled,2024-01-15,2024-01-30,2024-01-10
```

#### 5. `recommendations_mapping.csv` - Display Names
```csv
recommendation_id,display_name
R001,Safety Stock Optimization
R002,Demand Forecast Adjustment
```

#### 6. `segmentation.csv` - ABC/XYZ Inventory Classification
```csv
product_id,ABC_value,XYZ_value,on_hand_inventory_unit,on_hand_inventory_financial,target_inventory_unit,target_inventory_financial,on_hand_inventory_days,target_inventory_days
P001,A,X,500,7500,600,9000,45,40
P002,B,Y,300,4500,350,5250,25,22
```

### Data Sources
- **Local Mode**: Files from `public/local_data/` directory
- **Cloud Mode**: Files from AWS S3 via FastAPI backend
- **Mode Switching**: Controlled by localStorage and UI toggle

## UI Components

### Built with shadcn/ui
- Accessible by default (Radix UI primitives)
- Customizable with CSS variables
- Consistent design system
- Mobile-responsive

### Key UI Features
- Responsive design for all screen sizes
- Dark/light mode support
- Interactive data tables
- Modal dialogs and overlays
- Toast notifications
- Loading states and skeletons

## Development

### Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Code Organization
- TypeScript for type safety
- Component-based architecture
- Custom hooks for reusable logic
- Context providers for state management
- Utility functions for common operations

## Dependencies

### Core
- Next.js 15.5.4
- React 19.1.0
- TypeScript 5.x

### UI & Styling
- Tailwind CSS 4.1.9
- Radix UI components
- Lucide React icons
- shadcn/ui component library

### Data & Charts
- Recharts for visualizations
- date-fns for date handling
- React Hook Form for forms
- Zod for validation

### AWS Integration
- @aws-sdk/client-s3 for S3 operations
- JSZip for file compression

## Business Logic

### Supply Chain Analytics
- **Multi-dimensional Segmentation**: ABC-XYZ matrix analysis
- **Demand Forecasting**: 20-week historical trend analysis
- **Inventory Intelligence**: Real-time stock levels and turnover
- **Actionable Recommendations**: AI-driven optimization insights

### Data Processing
- **Generic CSV Loader**: Single function handles all file types
- **Data Aggregation**: Measures aggregated by product family and location
- **Complete Segmentation Matrix**: All 9 ABC/XYZ combinations
- **Time Series**: 20-week trending data for demand/supply/inventory
- **Currency Support**: Multi-currency formatting and conversion

## Deployment

### Vercel (Recommended)
```bash
npm run build
# Deploy to Vercel
```

### Other Platforms
- Netlify
- AWS Amplify
- Traditional hosting

### Environment Variables
Update `NEXT_PUBLIC_API_URL` for production backend URL

## Performance

- Server-side rendering with Next.js
- Optimized bundle size
- Lazy loading for components
- Image optimization
- Efficient re-rendering with React contexts
- Real-time data synchronization with backend
