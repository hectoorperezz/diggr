# Utility Scripts

This directory contains utility scripts used for development, debugging, and maintenance of the Diggr application.

## Script Categories

### Subscription Related Scripts
- `check-subscription.js` - Verifies the status of user subscriptions
- `debug-subscription-api.js` - Tool for debugging subscription API endpoints
- `fix-frontend-subscription.js` - Fixes frontend subscription issues
- `fix-subscription.js` - Fixes backend subscription data
- `update-subscription.js` - Updates subscription status in the database
- `list-stripe-products.js` - Lists all products in the Stripe account

### Database Scripts
- `check-tables.js` - Verifies that all required database tables exist
- `check-triggers.js` - Checks that database triggers are properly set up
- `create-tables-interactive.js` - Interactive tool to create database tables
- `check-usage-stats.js` - Verifies usage statistics tracking

### Environment & Configuration
- `create-env.js` - Helps create environment variables files
- `check-stripe-env.js` - Validates Stripe environment variables
- `test-env-variables.js` - Tests all environment variables

### Authentication
- `force-refresh.js` - Forces authentication token refresh

## Usage

Most scripts can be run using Node.js:

```bash
node scripts/script-name.js
```

Some scripts may require additional arguments or environment variables to be set. Check the script's content for specific usage instructions.

## Development Only

These scripts are intended for development and debugging purposes only and should not be used in production environments. 