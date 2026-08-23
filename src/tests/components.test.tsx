import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { AppButton } from '../components/ui/AppButton';
import { MoodSelector } from '../components/mood/MoodSelector';
import { AnxietySlider } from '../components/mood/AnxietySlider';

describe('Core UI Components Accessibility and Interaction Tests', () => {
  it('renders AppButton with title and handles press events', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(
      <AppButton title="Iniciar Respiração" onPress={onPressMock} />
    );

    const buttonText = getByText('Iniciar Respiração');
    expect(buttonText).toBeTruthy();

    fireEvent.press(buttonText);
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  it('renders MoodSelector with 1-5 scale and calls onChange when clicked', () => {
    const onChangeMock = jest.fn();
    const { getByLabelText } = render(
      <MoodSelector value={3} onChange={onChangeMock} />
    );

    const option5 = getByLabelText('Humor 5 de 5: Muito bem');
    expect(option5).toBeTruthy();

    fireEvent.press(option5);
    expect(onChangeMock).toHaveBeenCalledWith(5);
  });

  it('renders AnxietySlider and allows changing anxiety level', () => {
    const onChangeMock = jest.fn();
    const { getByLabelText } = render(
      <AnxietySlider value={2} onChange={onChangeMock} />
    );

    const level8 = getByLabelText(/Nível de ansiedade 8 de 10/);
    expect(level8).toBeTruthy();

    fireEvent.press(level8);
    expect(onChangeMock).toHaveBeenCalledWith(8);
  });
});
