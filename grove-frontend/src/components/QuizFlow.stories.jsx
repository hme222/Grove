import QuizFlow from './QuizFlow';

export default {
  title: 'Grove/QuizFlow',
  component: QuizFlow,
  parameters: {
    docs: {
      description: {
        component:
          'A one-screen, multi-select quiz that chooses the first lesson. Saving needs the backend, so in Storybook the buttons show the error state.',
      },
    },
  },
};

export const Default = { args: { onDone: () => {} } };
