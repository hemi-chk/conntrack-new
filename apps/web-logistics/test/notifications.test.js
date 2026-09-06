import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { getPriorityStyles, getTypeIcon } from '../src/lib/notifications.js';

// =========================================================
// WEB-LOGISTICS UTILITIES UNIT TESTS
// ---------------------------------------------------------
// Verifies priority style mapping and category icon mapping.
// =========================================================

describe('Web Logistics Notifications Utility Tests', () => {

    describe('getPriorityStyles Utility', () => {
        it('should return correct CSS classes for critical priority', () => {
            const styles = getPriorityStyles('critical');
            assert.equal(styles, 'bg-red-50 text-red-700 border-red-200');
        });

        it('should return correct CSS classes for high priority', () => {
            const styles = getPriorityStyles('high');
            assert.equal(styles, 'bg-amber-50 text-amber-700 border-amber-200');
        });

        it('should return correct CSS classes for medium priority', () => {
            const styles = getPriorityStyles('medium');
            assert.equal(styles, 'bg-blue-50 text-blue-700 border-blue-200');
        });

        it('should return correct CSS classes for low priority', () => {
            const styles = getPriorityStyles('low');
            assert.equal(styles, 'bg-slate-100 text-slate-600 border-slate-200');
        });

        it('should fallback to medium styles for unknown priority', () => {
            const styles = getPriorityStyles('unknown_priority');
            assert.equal(styles, 'bg-blue-50 text-blue-700 border-blue-200');
        });
    });

    describe('getTypeIcon Utility', () => {
        it('should map order type to Package icon identifier', () => {
            assert.equal(getTypeIcon('order'), 'Package');
        });

        it('should map issue type to AlertTriangle icon identifier', () => {
            assert.equal(getTypeIcon('issue'), 'AlertTriangle');
        });

        it('should map tracking type to MapPin icon identifier', () => {
            assert.equal(getTypeIcon('tracking'), 'MapPin');
        });

        it('should map document type to FileText icon identifier', () => {
            assert.equal(getTypeIcon('document'), 'FileText');
        });

        it('should map info type to Bell icon identifier', () => {
            assert.equal(getTypeIcon('info'), 'Bell');
        });

        it('should fallback to Bell for unknown notification type', () => {
            assert.equal(getTypeIcon('custom_type'), 'Bell');
        });
    });

});
