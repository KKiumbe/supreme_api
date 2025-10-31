"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const userRoute_1 = __importDefault(require("./routes/userRoute"));
const inventory_1 = __importDefault(require("./routes/meterInventoryRoute/inventory"));
const tarrifs_1 = __importDefault(require("./routes/tarrifsRoute/tarrifs"));
const location_1 = __importDefault(require("./routes/schemeZoneRoute/location"));
const customers_1 = __importDefault(require("./routes/customersRoute/customers"));
const readings_1 = __importDefault(require("./routes/meterReadingRoutes/readings"));
const connections_1 = __importDefault(require("./routes/connectionsRoute/connections"));
const bills_1 = __importDefault(require("./routes/billsRoute/bills"));
const billTypes_1 = __importDefault(require("./routes/billtypesRoutes/billTypes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json());
// ✅ Configure CORS properly
app.use((0, cors_1.default)({
    origin: true, // allows any origin
    credentials: true,
}));
app.use('/api', userRoute_1.default);
app.use('/api', inventory_1.default);
app.use('/api', tarrifs_1.default);
app.use('/api', customers_1.default);
app.use('/api', location_1.default);
app.use('/api', connections_1.default);
app.use('/api', readings_1.default);
app.use('/api', bills_1.default);
app.use('/api', billTypes_1.default);
app.get('/', (req, res) => {
    res.send('API is running 🚀');
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
