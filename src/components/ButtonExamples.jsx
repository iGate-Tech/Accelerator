import { createSignal } from 'solid-js';
import Button, {
  ButtonGroup,
  ButtonDropdown,
  IconButton,
  FloatingActionButton,
} from './Button.jsx';

/**
 * Example usage of the Button component
 * This file demonstrates all the different button variants and configurations
 */
export const ButtonExamples = () => {
  const [loading, setLoading] = createSignal(false);
  const [count, setCount] = createSignal(0);

  const handleLoadingClick = async () => {
    setLoading(true);
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 2000));
    setLoading(false);
  };

  const handleIncrement = () => {
    setCount(count() + 1);
  };

  const dropdownItems = [
    {
      label: 'Profile',
      icon: 'user',
      onClick: () => console.log('Profile clicked'),
    },
    {
      label: 'Settings',
      icon: 'settings',
      onClick: () => console.log('Settings clicked'),
    },
    {
      label: 'Logout',
      icon: 'log-out',
      onClick: () => console.log('Logout clicked'),
    },
  ];

  return (
    <div class="space-y-8 p-6">
      <h2 class="mb-6 text-2xl font-bold">Button Component Examples</h2>

      {/* Basic Variants */}
      <div class="space-y-4">
        <h3 class="text-lg font-semibold">Basic Variants</h3>
        <div class="flex flex-wrap gap-3">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="success">Success</Button>
          <Button variant="warning">Warning</Button>
          <Button variant="error">Error</Button>
          <Button variant="info">Info</Button>
        </div>
      </div>

      {/* Sizes */}
      <div class="space-y-4">
        <h3 class="text-lg font-semibold">Sizes</h3>
        <div class="flex items-center gap-3">
          <Button variant="primary" size="xs">
            Extra Small
          </Button>
          <Button variant="primary" size="sm">
            Small
          </Button>
          <Button variant="primary" size="md">
            Medium
          </Button>
          <Button variant="primary" size="lg">
            Large
          </Button>
        </div>
      </div>

      {/* States */}
      <div class="space-y-4">
        <h3 class="text-lg font-semibold">States</h3>
        <div class="flex flex-wrap gap-3">
          <Button variant="primary">Normal</Button>
          <Button variant="primary" disabled>
            Disabled
          </Button>
          <Button
            variant="primary"
            loading={loading()}
            onClick={handleLoadingClick}
          >
            {loading() ? 'Loading...' : 'Click to Load'}
          </Button>
        </div>
      </div>

      {/* Icons */}
      <div class="space-y-4">
        <h3 class="text-lg font-semibold">With Icons</h3>
        <div class="flex flex-wrap gap-3">
          <Button variant="primary" leftIcon="plus">
            Add Item
          </Button>
          <Button variant="outline" rightIcon="arrow-right">
            Continue
          </Button>
          <Button variant="ghost" leftIcon="download" rightIcon="chevron-down">
            Download
          </Button>
        </div>
      </div>

      {/* Shapes */}
      <div class="space-y-4">
        <h3 class="text-lg font-semibold">Shapes</h3>
        <div class="flex items-center gap-3">
          <Button variant="primary">Normal</Button>
          <Button variant="primary" circle>
            <i data-lucide="plus" class="h-4 w-4" />
          </Button>
          <Button variant="primary" square>
            <i data-lucide="settings" class="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Width */}
      <div class="space-y-4">
        <h3 class="text-lg font-semibold">Width</h3>
        <div class="space-y-3">
          <Button variant="primary" class="w-48">
            Fixed Width
          </Button>
          <Button variant="outline" fullWidth>
            Full Width
          </Button>
        </div>
      </div>

      {/* Interactive */}
      <div class="space-y-4">
        <h3 class="text-lg font-semibold">Interactive</h3>
        <div class="flex flex-wrap items-center gap-3">
          <Button variant="primary" onClick={handleIncrement}>
            Count: {count()}
          </Button>
          <Button variant="secondary" onClick={() => setCount(0)}>
            Reset
          </Button>
        </div>
      </div>

      {/* Button Group */}
      <div class="space-y-4">
        <h3 class="text-lg font-semibold">Button Group</h3>
        <ButtonGroup>
          <Button variant="outline">Left</Button>
          <Button variant="primary">Middle</Button>
          <Button variant="outline">Right</Button>
        </ButtonGroup>

        <ButtonGroup direction="vertical" class="mt-3">
          <Button variant="outline" leftIcon="upload">
            Upload
          </Button>
          <Button variant="outline" leftIcon="download">
            Download
          </Button>
          <Button variant="outline" leftIcon="share">
            Share
          </Button>
        </ButtonGroup>
      </div>

      {/* Button Dropdown */}
      <div class="space-y-4">
        <h3 class="text-lg font-semibold">Button Dropdown</h3>
        <div class="flex flex-wrap gap-3">
          <ButtonDropdown variant="outline" dropdownItems={dropdownItems}>
            Menu
          </ButtonDropdown>

          <ButtonDropdown
            variant="primary"
            leftIcon="user"
            dropdownItems={dropdownItems}
          >
            User Menu
          </ButtonDropdown>
        </div>
      </div>

      {/* Icon Buttons */}
      <div class="space-y-4">
        <h3 class="text-lg font-semibold">Icon Buttons</h3>
        <div class="flex flex-wrap gap-3">
          <IconButton icon="heart" variant="ghost" />
          <IconButton icon="star" variant="outline" />
          <IconButton icon="bell" variant="primary" />
          <IconButton icon="trash" variant="error" size="lg" />
        </div>
      </div>

      {/* Floating Action Button */}
      <div class="space-y-4">
        <h3 class="text-lg font-semibold">Floating Action Button</h3>
        <div class="bg-base-200 relative h-32 rounded-lg">
          <FloatingActionButton
            icon="plus"
            variant="primary"
            position="bottom-right"
            class="m-4"
            onClick={() => console.log('FAB clicked')}
          />
        </div>
      </div>

      {/* Custom Styles */}
      <div class="space-y-4">
        <h3 class="text-lg font-semibold">Custom Styles</h3>
        <div class="flex flex-wrap gap-3">
          <Button
            variant="primary"
            class="rounded-full shadow-lg hover:shadow-xl"
          >
            Custom Button
          </Button>
          <Button variant="outline" class="border-2 border-dashed" noAnimation>
            No Animation
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ButtonExamples;
