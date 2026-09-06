import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
    createLogisticsNotification,
    getNotifications,
    markAllNotificationsAsRead,
    markNotificationAsRead
} from '../src/controllers/logistics.controller.js';

// =========================================================
// LOGISTICS SYSTEM UNIT & INTEGRATION TESTS
// ---------------------------------------------------------
// These tests verify the business logic, payload normalization,
// error handling, and notification handlers for api-logistics.
// =========================================================

describe('Logistics System - Notifications Module', () => {

    describe('createLogisticsNotification Validation', () => {
        it('should throw an error if title or message is missing', async () => {
            await assert.rejects(
                async () => {
                    await createLogisticsNotification({ title: '', message: 'Missing title' });
                },
                {
                    name: 'Error',
                    message: 'Notification title and message are required',
                }
            );

            await assert.rejects(
                async () => {
                    await createLogisticsNotification({ title: 'Test Title', message: '' });
                },
                {
                    name: 'Error',
                    message: 'Notification title and message are required',
                }
            );
        });
    });

    describe('getNotifications Handler', () => {
        it('should return 401 status if user is not authenticated', async () => {
            const req = { user: null };
            let statusCode = 0;
            let jsonBody = null;

            const res = {
                status: (code) => {
                    statusCode = code;
                    return res;
                },
                json: (body) => {
                    jsonBody = body;
                    return res;
                },
            };

            await getNotifications(req, res);

            assert.equal(statusCode, 401);
            assert.deepEqual(jsonBody, { message: 'User not authenticated' });
        });
    });

    describe('markNotificationAsRead Handler', () => {
        it('should return 401 status if user is not authenticated', async () => {
            const req = { params: { id: '10' }, user: null };
            let statusCode = 0;
            let jsonBody = null;

            const res = {
                status: (code) => {
                    statusCode = code;
                    return res;
                },
                json: (body) => {
                    jsonBody = body;
                    return res;
                },
            };

            await markNotificationAsRead(req, res);

            assert.equal(statusCode, 401);
            assert.deepEqual(jsonBody, { message: 'User not authenticated' });
        });
    });

    describe('markAllNotificationsAsRead Handler', () => {
        it('should return 401 status if user is not authenticated', async () => {
            const req = { user: null };
            let statusCode = 0;
            let jsonBody = null;

            const res = {
                status: (code) => {
                    statusCode = code;
                    return res;
                },
                json: (body) => {
                    jsonBody = body;
                    return res;
                },
            };

            await markAllNotificationsAsRead(req, res);

            assert.equal(statusCode, 401);
            assert.deepEqual(jsonBody, { message: 'User not authenticated' });
        });
    });

});
