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

app.use(
  cors({
    origin: true, // allow all origins
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  })
);


// Routes (remove /api prefix to match Nginx proxy)
app.use('/', authRoutes); // Changed from /api
app.use('/', metersRoutes);
app.use('/', tarrifsRoutes);
app.use('/', customersRoutes);
app.use('/', schemesZoneRoutes);
app.use('/', connectionRoutes);
app.use('/', meterReadingRoutes);
app.use('/', billsRoutes);
app.use('/', billTypesRoutes);

app.get('/', (req, res) => {
  res.send('API is running 🚀');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));