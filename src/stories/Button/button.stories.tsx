import './button.scss';
import Button from './Button';
import React from 'react';

export default {
  component: Button,
  title: 'Button', // El título de tu componente en Storybook
  argTypes: {
    // Control para editar el texto del botón
    type: ['large-yellow', 'large-blue', 'small-yellow', 'small-gray'] // Control para editar el color del botón
  }
};

const Template = (args) => <Button {...args} />;

export const LargeYellow = Template.bind({});
LargeYellow.args = {
  label: 'Botón 1',
  type: 'large-yellow'
  //dataTestId: 'large-yellow-button'
};

export const LargeBlue = Template.bind({});
LargeBlue.args = {
  label: 'Botón 2',
  type: 'large-blue'
};

export const SmallYellow = Template.bind({});
SmallYellow.args = {
  label: 'Botón Pequeño 1',
  type: 'small-yellow'
};

export const SmallGray = Template.bind({});
SmallGray.args = {
  label: 'Botón Pequeño 2',
  type: 'small-gray'
  // dataTestId: 'small-gray-button'
};
