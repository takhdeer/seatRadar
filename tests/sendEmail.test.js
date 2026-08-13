const sendEmail = require('../server/utils/sendEmail');

// Mock fetch globally
global.fetch = jest.fn();

describe('sendEmail', () => {
    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();
        process.env.POSTMARK_API_KEY = 'test-api-key';
    });

    afterEach(() => {
        delete process.env.POSTMARK_API_KEY;
    });

    describe('successful email sending', () => {
        it('should send emails to all recipients successfully', async () => {
            const recipients = [
                { email: 'test1@example.com' },
                { email: 'test2@example.com' }
            ];

            const courseInfo = {
                slotType: 'Seat',
                Subject: 'COMP',
                courseNum: '3612'
            };

            // Mock successful API response
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => [
                    { ErrorCode: 0, Message: 'OK' },
                    { ErrorCode: 0, Message: 'OK' }
                ]
            });

            await sendEmail(recipients, courseInfo);

            // Verify fetch was called
            expect(global.fetch).toHaveBeenCalledTimes(1);
            expect(global.fetch).toHaveBeenCalledWith(
                'https://api.postmarkapp.com/email/batch',
                expect.objectContaining({
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Postmark-Server-Token': 'test-api-key'
                    }
                })
            );

            // Verify the body contains correct message structure
            const callBody = JSON.parse(global.fetch.mock.calls[0][1].body);
            expect(callBody).toHaveLength(2);
            expect(callBody[0]).toMatchObject({
                From: 'RADAR_EMAIL',
                To: 'test1@example.com',
                Subject: 'Seat Available for COMP 3612',
                MessageStream: 'outbound'
            });
        });

        it('should handle large recipient lists by chunking (500+ recipients)', async () => {
            // Create 1000 recipients
            const recipients = Array.from({ length: 1000 }, (_, i) => ({
                email: `test${i}@example.com`
            }));

            const courseInfo = {
                slotType: 'Waitlist',
                Subject: 'MATH',
                courseNum: '2000'
            };

            // Mock successful responses for each chunk
            global.fetch
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => Array(500).fill({ ErrorCode: 0, Message: 'OK' })
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => Array(500).fill({ ErrorCode: 0, Message: 'OK' })
                });

            await sendEmail(recipients, courseInfo);

            // Should be called twice (1000 emails / 500 per chunk)
            expect(global.fetch).toHaveBeenCalledTimes(2);
        });
    });

    describe('error handling', () => {
        it('should handle API errors gracefully', async () => {
            const recipients = [{ email: 'test@example.com' }];
            const courseInfo = {
                slotType: 'Seat',
                Subject: 'COMP',
                courseNum: '3612'
            };

            // Mock failed API response
            global.fetch.mockResolvedValueOnce({
                ok: false,
                status: 500
            });

            const result = await sendEmail(recipients, courseInfo);

            expect(result).toBeDefined();
            expect(global.fetch).toHaveBeenCalledTimes(1);
        });

        it('should log errors when Postmark returns error codes', async () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            const recipients = [
                { email: 'invalid@example.com' },
                { email: 'valid@example.com' }
            ];

            const courseInfo = {
                slotType: 'Seat',
                Subject: 'COMP',
                courseNum: '3612'
            };

            // Mock response with one error
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => [
                    { ErrorCode: 406, Message: 'Inactive recipient' },
                    { ErrorCode: 0, Message: 'OK' }
                ]
            });

            await sendEmail(recipients, courseInfo);

            // Should log the error code
            expect(consoleSpy).toHaveBeenCalledWith(406);

            consoleSpy.mockRestore();
        });

        it('should handle missing API key', async () => {
            delete process.env.POSTMARK_API_KEY;

            const recipients = [{ email: 'test@example.com' }];
            const courseInfo = {
                slotType: 'Seat',
                Subject: 'COMP',
                courseNum: '3612'
            };

            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => [{ ErrorCode: 0, Message: 'OK' }]
            });

            await sendEmail(recipients, courseInfo);

            // Verify fetch was called with undefined API key
            const headers = global.fetch.mock.calls[0][1].headers;
            expect(headers['X-Postmark-Server-Token']).toBeUndefined();
        });
    });

    describe('message formatting', () => {
        it('should format subject line correctly for Seat availability', async () => {
            const recipients = [{ email: 'test@example.com' }];
            const courseInfo = {
                slotType: 'Seat',
                Subject: 'COMP',
                courseNum: '3612'
            };

            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => [{ ErrorCode: 0, Message: 'OK' }]
            });

            await sendEmail(recipients, courseInfo);

            const callBody = JSON.parse(global.fetch.mock.calls[0][1].body);
            expect(callBody[0].Subject).toBe('Seat Available for COMP 3612');
        });

        it('should format subject line correctly for Waitlist availability', async () => {
            const recipients = [{ email: 'test@example.com' }];
            const courseInfo = {
                slotType: 'Waitlist',
                Subject: 'MATH',
                courseNum: '2000'
            };

            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => [{ ErrorCode: 0, Message: 'OK' }]
            });

            await sendEmail(recipients, courseInfo);

            const callBody = JSON.parse(global.fetch.mock.calls[0][1].body);
            expect(callBody[0].Subject).toBe('Waitlist Available for MATH 2000');
        });
    });

    describe('edge cases', () => {
        it('should handle empty recipient list', async () => {
            const recipients = [];
            const courseInfo = {
                slotType: 'Seat',
                Subject: 'COMP',
                courseNum: '3612'
            };

            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => []
            });

            await sendEmail(recipients, courseInfo);

            // Should still attempt to send (with empty array)
            expect(global.fetch).toHaveBeenCalledTimes(1);
        });

        it('should handle exactly 500 recipients (boundary test)', async () => {
            const recipients = Array.from({ length: 500 }, (_, i) => ({
                email: `test${i}@example.com`
            }));

            const courseInfo = {
                slotType: 'Seat',
                Subject: 'COMP',
                courseNum: '3612'
            };

            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => Array(500).fill({ ErrorCode: 0, Message: 'OK' })
            });

            await sendEmail(recipients, courseInfo);

            // Should be exactly 1 call (500 is the chunk limit)
            expect(global.fetch).toHaveBeenCalledTimes(1);
        });

        it('should handle 501 recipients (just over boundary)', async () => {
            const recipients = Array.from({ length: 501 }, (_, i) => ({
                email: `test${i}@example.com`
            }));

            const courseInfo = {
                slotType: 'Seat',
                Subject: 'COMP',
                courseNum: '3612'
            };

            global.fetch
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => Array(500).fill({ ErrorCode: 0, Message: 'OK' })
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => [{ ErrorCode: 0, Message: 'OK' }]
                });

            await sendEmail(recipients, courseInfo);

            // Should be 2 calls (500 + 1)
            expect(global.fetch).toHaveBeenCalledTimes(2);
        });
    });
});