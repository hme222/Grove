import NookOfferCard from './NookOfferCard';

export default {
  title: 'Grove/Pip’s nook offer',
  component: NookOfferCard,
  parameters: {
    docs: {
      description: {
        component:
          'The one-time offer, shown after a new user’s first real action. Either answer is saved, so it is never shown again. Saving needs the backend, so in Storybook the buttons show the error state.',
      },
    },
  },
};

export const Offer = { args: { onDone: () => {} } };
