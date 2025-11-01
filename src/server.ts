import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';

import authRoutes from './routes/userRoute';
import metersRoutes from './routes/meterInventoryRoute/inventory';
import tarrifsRoutes from './routes/tarrifsRoute/tarrifs';
import schemesZoneRoutes from './routes/schemeZoneRoute/location';
import customersRoutes from './routes/customersRoute/customers';
import meterReadingRoutes from './routes/meterReadingRoutes/readings';
import connectionRoutes from './routes/connectionsRoute/connections';
import billsRoutes from './routes/billsRoute/bills';
import billTypesRoutes from './routes/billtypesRoutes/billTypes';

dotenv.config();
const app = express();

app.use(cookieParser());
app.use(express.json());

const allowedOrigins = ['https://frolicking-speculoos-9c49e3.netlify.app'];
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  })
);
app.options('*', cors());

// Routes
app.use('/api', authRoutes);
app.use('/api', metersRoutes);
app.use('/api', tarrifsRoutes);
app.use('/api', customersRoutes);
app.use('/api', schemesZoneRoutes);
app.use('/api', connectionRoutes);
app.use('/api', meterReadingRoutes);
app.use('/api', billsRoutes);
app.use('/api', billTypesRoutes);

app.get('/', (req, res) => {
  res.send('API is running 🚀');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
