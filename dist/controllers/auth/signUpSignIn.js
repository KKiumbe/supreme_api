"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signin = exports.register = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
const globalPrisma_1 = __importDefault(require("./../../globalPrisma"));
dotenv_1.default.config();
const roles_1 = __importDefault(require("./roles"));
// 2. Main register function
const register = async (req, res) => {
    const { firstName, lastName, phoneNumber, email, county, town, gender, password, tenantName, } = req.body;
    try {
        // Validate required fields
        if (!firstName || !lastName || !phoneNumber || !email || !password || !tenantName) {
            return res.status(400).json({
                message: 'All fields (firstName, lastName, phoneNumber, email, password, tenantName) are required',
            });
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }
        if (phoneNumber.length < 9 || !/^\d+$/.test(phoneNumber)) {
            return res.status(400).json({ message: 'Phone number must be numeric and at least 9 digits' });
        }
        // Check for existing user
        const existingUser = await globalPrisma_1.default.user.findFirst({
            where: {
                OR: [{ phoneNumber }, { email }],
            },
        });
        if (existingUser) {
            const conflictField = existingUser.phoneNumber === phoneNumber ? 'Phone number' : 'Email';
            return res.status(400).json({ message: `${conflictField} is already registered` });
        }
        // Hash the password
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        // Default roles
        const defaultRoles = ['ADMIN'];
        // Validate roles
        const validRoles = Object.keys(roles_1.default);
        const invalidRoles = defaultRoles.filter(role => !validRoles.includes(role));
        if (invalidRoles.length > 0) {
            return res.status(400).json({
                message: `Invalid roles: ${invalidRoles.join(', ')}. Must be defined in ROLE_PERMISSIONS`,
            });
        }
        // Transaction to create tenant and user
        const { user, tenant } = await globalPrisma_1.default.$transaction(async (prisma) => {
            const newTenant = await prisma.tenant.create({
                data: {
                    name: tenantName,
                    monthlyCharge: 0.0,
                    status: 'ACTIVE',
                },
            });
            const newUser = await prisma.user.create({
                data: {
                    firstName,
                    lastName,
                    phoneNumber,
                    username: phoneNumber,
                    email,
                    gender: gender ?? null,
                    password: hashedPassword,
                    role: defaultRoles,
                    tenant: {
                        connect: { id: newTenant.id },
                    },
                    lastLogin: new Date(),
                    loginCount: 1,
                    status: 'ACTIVE',
                },
            });
            await prisma.auditLog.create({
                data: {
                    tenant: { connect: { id: newTenant.id } },
                    user: { connect: { id: newUser.id } },
                    action: 'CREATE',
                    resource: 'USER_TENANT',
                    details: { message: `User ${newUser.email} created tenant ${tenantName}` },
                },
            });
            return { user: newUser, tenant: newTenant };
        });
        // Configure tenant settings
        // Success response
        res.status(201).json({
            message: 'User and tenant created successfully',
            user: {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phoneNumber: user.phoneNumber,
                role: user.role,
                tenantId: tenant.id,
            },
            tenant: {
                id: tenant.id,
                name: tenant.name,
            },
        });
    }
    catch (error) {
        console.error('Error registering user and tenant:', error);
        if (error.code === 'P2002') {
            return res.status(400).json({ message: 'Email, phone number, or tenant name already exists' });
        }
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
    finally {
        await globalPrisma_1.default.$disconnect();
    }
};
exports.register = register;
// Main signin function
const signin = async (req, res) => {
    const { phoneNumber, password } = req.body;
    try {
        // Input validation
        if (!phoneNumber || !password) {
            return res.status(400).json({ message: 'Phone number and password are required' });
        }
        // Find the user
        const user = await globalPrisma_1.default.user.findUnique({
            where: { phoneNumber },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                phoneNumber: true,
                password: true,
                role: true,
                email: true,
                tenantId: true,
                tenant: {
                    select: { id: true, name: true },
                },
            },
        });
        if (!user) {
            return res.status(401).json({ message: 'Invalid phone number or password' });
        }
        // Compare password
        const isPasswordValid = await bcrypt_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid phone number or password' });
        }
        // Update login info
        await globalPrisma_1.default.user.update({
            where: { id: user.id },
            data: {
                lastLogin: new Date(),
                loginCount: { increment: 1 },
            },
        });
        await globalPrisma_1.default.auditLog.create({
            data: {
                tenantId: user.tenantId,
                userId: user.id,
                action: 'LOGIN',
                resource: 'user',
                details: { message: `User ${user.firstName} logged in` },
            },
        });
        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET is not set');
        }
        const token = jsonwebtoken_1.default.sign({
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phoneNumber: user.phoneNumber,
            role: user.role,
            tenantId: user.tenantId,
            tenantName: user.tenant.name,
        }, process.env.JWT_SECRET, { expiresIn: '1d' });
        // Set cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000, // 1 day
        });
        // Return user info (excluding password)
        const { password: _, ...userInfo } = user;
        res.status(200).json({ message: 'Login successful', user: userInfo });
    }
    catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
    finally {
        await globalPrisma_1.default.$disconnect();
    }
};
exports.signin = signin;
module.exports = { register: exports.register, signin: exports.signin };
