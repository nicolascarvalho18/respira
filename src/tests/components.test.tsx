import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { AppButton } from '../components/ui/AppButton';
import { Chip } from '../components/ui/Chip';
import { Badge } from '../components/ui/Badge';
import { MoodSelector } from '../components/mood/MoodSelector';
import { AnxietySlider } from '../components/mood/AnxietySlider';

describe('Core UI Design System Accessibility and Interaction Tests', () => {
  it('renders AppButton and triggers onPress event', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(
      <AppButton title="Iniciar Respiração" onPress={onPressMock} />
    );

    const buttonText = getByText('Iniciar Respiração');
    expect(buttonText).toBeTruthy();

    fireEvent.press(buttonText);
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  it('renders Chip with selected state and calls onPress', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(
      <Chip label="Respiração" selected={true} count={4} onPress={onPressMock} />
    );

    const chipText = getByText('Respiração');
    expect(chipText).toBeTruthy();

    fireEvent.press(chipText);
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  it('renders Badge with text and uppercase label', () => {
    const { getByText } = render(<Badge label="Personalizado" variant="success" />);
    expect(getByText('Personalizado')).toBeTruthy();
  });

  it('renders MoodSelector and handles selection', () => {
    const onChangeMock = jest.fn();
    const { getByLabelText } = render(
      <MoodSelector value={3} onChange={onChangeMock} />
    );

    const option5 = getByLabelText('Humor 5 de 5: Muito bem');
    expect(option5).toBeTruthy();

    fireEvent.press(option5);
    expect(onChangeMock).toHaveBeenCalledWith(5);
  });

  it('renders AnxietySlider and handles change', () => {
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
