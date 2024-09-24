import Stripe from 'stripe';
import settings from '../config/settings';

const stripe = new Stripe(settings.stripe.secret_key, {
    apiVersion: settings.stripe.api_version,
    typescript: true
});

export default stripe;