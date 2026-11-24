import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import HomeScreen from '../index';
import { DEFAULT_BUDGET_CENTS } from '@/constants';
import { toNoonISO } from '@/lib/dates';
import { useExpenseStore } from '@/store/useExpenseStore';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { darkColors, lightColors } from '@/theme/tokens';

jest.mock('@/lib/haptics', () => ({
  selection: jest.fn(),
}));

const safeAreaMetrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

function renderHome() {
  return render(
    <SafeAreaProvider initialMetrics={safeAreaMetrics}>
      <ThemeProvider>
        <HomeScreen />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

beforeEach(async () => {
  await AsyncStorage.clear();
  useExpenseStore.setState({
    expenses: [],
    budgetCents: DEFAULT_BUDGET_CENTS,
    themeMode: 'light',
    hasSeeded: true,
    lastDeleted: null,
  });
  await useExpenseStore.persist.rehydrate();
});

describe('home foundation screen', () => {
  it('shows the current-month total and expense count', async () => {
    useExpenseStore.setState({
      expenses: [
        {
          id: 'one',
          amountCents: 1250,
          categoryId: 'food',
          date: toNoonISO(new Date()),
          note: 'Lunch',
          createdAt: 0,
        },
      ],
    });
    const { getByText } = await renderHome();
    expect(getByText('$12.50')).toBeTruthy();
    expect(getByText('1')).toBeTruthy();
  });

  it('changes themed text colors when the temporary theme control is pressed', async () => {
    const { getByText, getByRole } = await renderHome();
    expect(getByText('Spendly')).toHaveStyle({ color: lightColors.text });
    const button = getByRole('button', { name: /Change theme/ });
    await fireEvent.press(button);
    expect(getByText('Spendly')).toHaveStyle({ color: darkColors.text });
    expect(getByText('Theme: dark')).toBeTruthy();
  });
});

