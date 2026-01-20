import { createSignal, For, Show, splitProps } from "solid-js";
import { useLucideIcons } from "../hooks/useLucideIcons";

/**
 * Reusable Button component for the Accelerator app
 * Supports multiple variants, sizes, and states with SolidJS reactivity
 * 
 * @param {Object} props - Component props
 * @param {string} props.variant - Button variant: 'primary', 'secondary', 'outline', 'ghost', 'success', 'warning', 'error', 'info'
 * @param {string} props.size - Button size: 'xs', 'sm', 'md', 'lg'
 * @param {boolean} props.loading - Show loading state
 * @param {boolean} props.disabled - Disable button
 * @param {boolean} props.fullWidth - Full width button
 * @param {boolean} props.circle - Circular button
 * @param {boolean} props.square - Square button
 * @param {string} props.leftIcon - Icon name to show on left (Lucide icon name)
 * @param {string} props.rightIcon - Icon name to show on right (Lucide icon name)
 * @param {string} props.loadingText - Text to show during loading
 * @param {Function} props.onClick - Click handler
 * @param {string} props.class - Additional CSS classes
 * @param {string} props.type - Button type: 'button', 'submit', 'reset'
 * @param {boolean} props.noAnimation - Disable hover/focus animations
 * @returns {JSX.Element} Button component
 */
const Button = (props) => {
  const [local, rest] = splitProps(props, [
    'variant',
    'size', 
    'loading',
    'disabled',
    'fullWidth',
    'circle',
    'square',
    'leftIcon',
    'rightIcon',
    'loadingText',
    'children',
    'class',
    'type',
    'noAnimation'
  ]);

  const [isPressed, setIsPressed] = createSignal(false);
  const [showRipple, setShowRipple] = createSignal(false);
  const [ripplePosition, setRipplePosition] = createSignal({ x: 0, y: 0 });

  // Initialize Lucide icons
  useLucideIcons();

  // Default props
  const variant = () => local.variant || 'primary';
  const size = () => local.size || 'md';
  const loading = () => local.loading || false;
  const disabled = () => local.disabled || false;
  const loadingText = () => local.loadingText || 'Loading...';

  // Get variant classes
  const getVariantClasses = () => {
    const variants = {
      primary: 'btn-primary',
      secondary: 'btn-secondary',
      outline: 'btn-outline',
      ghost: 'btn-ghost',
      success: 'btn-success',
      warning: 'btn-warning', 
      error: 'btn-error',
      info: 'btn-info'
    };
    return variants[variant()] || variants.primary;
  };

  // Get size classes
  const getSizeClasses = () => {
    const sizes = {
      xs: 'btn-xs',
      sm: 'btn-sm', 
      md: '',
      lg: 'btn-lg'
    };
    return sizes[size()] || sizes.md;
  };

  // Get shape classes
  const getShapeClasses = () => {
    if (local.circle) return 'btn-circle';
    if (local.square) return 'btn-square';
    return '';
  };

  // Get width classes
  const getWidthClasses = () => {
    if (local.fullWidth) return 'btn-block';
    return '';
  };

  // Get animation classes
  const getAnimationClasses = () => {
    if (local.noAnimation) return '';
    return 'transition-all duration-200 hover:scale-105 active:scale-95';
  };

  // Handle ripple effect
  const handleClick = (e) => {
    if (loading() || disabled()) return;

    // Create ripple effect
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setRipplePosition({ x, y });
    setShowRipple(true);
    
    setTimeout(() => setShowRipple(false), 600);

    // Call original onClick if provided
    if (rest.onClick) {
      rest.onClick(e);
    }
  };

  // Handle mouse events for press state
  const handleMouseDown = () => {
    if (!loading() && !disabled()) {
      setIsPressed(true);
    }
  };

  const handleMouseUp = () => {
    setIsPressed(false);
  };

  const handleMouseLeave = () => {
    setIsPressed(false);
  };

  // Build button classes
  const buttonClasses = () => {
    const classes = [
      'btn',
      getVariantClasses(),
      getSizeClasses(),
      getShapeClasses(),
      getWidthClasses(),
      getAnimationClasses(),
      local.class || ''
    ];

    // Add state classes
    if (loading()) classes.push('btn-loading');
    if (disabled()) classes.push('btn-disabled');
    if (isPressed()) classes.push('scale-95');

    return classes.filter(Boolean).join(' ');
  };

  return (
    <button
      {...rest}
      type={local.type || 'button'}
      class={buttonClasses()}
      disabled={disabled() || loading()}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      aria-disabled={disabled() || loading()}
      aria-busy={loading()}
    >
      {/* Ripple effect */}
      <Show when={showRipple() && !local.noAnimation}>
        <span
          class="absolute pointer-events-none rounded-full bg-white/30 animate-ping"
          style={{
            left: `${ripplePosition().x}px`,
            top: `${ripplePosition().y}px`,
            width: '20px',
            height: '20px',
            transform: 'translate(-50%, -50%)'
          }}
        />
      </Show>

      {/* Loading spinner */}
      <Show when={loading()}>
        <span class="loading loading-spinner loading-xs md:loading-sm" />
      </Show>

      {/* Left icon */}
      <Show when={local.leftIcon && !loading()}>
        <i 
          data-lucide={local.leftIcon} 
          class="w-4 h-4" 
          classList={{
            'w-3 h-3': size() === 'xs',
            'w-4 h-4': size() === 'sm' || size() === 'md',
            'w-5 h-5': size() === 'lg'
          }}
        />
      </Show>

      {/* Button content */}
      <Show when={!loading()}>
        {local.children}
      </Show>
      
      <Show when={loading()}>
        {loadingText()}
      </Show>

      {/* Right icon */}
      <Show when={local.rightIcon && !loading()}>
        <i 
          data-lucide={local.rightIcon} 
          class="w-4 h-4" 
          classList={{
            'w-3 h-3': size() === 'xs',
            'w-4 h-4': size() === 'sm' || size() === 'md', 
            'w-5 h-5': size() === 'lg'
          }}
        />
      </Show>
    </button>
  );
};

// Button Group component for grouping related buttons
export const ButtonGroup = (props) => {
  const { children, class: className = '', direction = 'horizontal', gap = '2' } = props;

  const getGroupClasses = () => {
    const baseClasses = 'btn-group';
    const directionClasses = direction === 'vertical' ? 'btn-group-vertical' : '';
    const gapClasses = `gap-${gap}`;
    
    return [baseClasses, directionClasses, gapClasses, className].filter(Boolean).join(' ');
  };

  return (
    <div class={getGroupClasses()}>
      {children}
    </div>
  );
};

// Button with dropdown functionality
export const ButtonDropdown = (props) => {
  const { 
    children, 
    dropdownItems = [], 
    class: className = '',
    position = 'bottom',
    align = 'left'
  } = props;

  const [isOpen, setIsOpen] = createSignal(false);

  const getDropdownClasses = () => {
    const baseClasses = 'dropdown';
    const positionClasses = `dropdown-${position}`;
    const alignClasses = align === 'right' ? 'dropdown-end' : '';
    
    return [baseClasses, positionClasses, alignClasses].filter(Boolean).join(' ');
  };

  const getContentClasses = () => {
    const baseClasses = 'dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52';
    return baseClasses;
  };

  return (
    <div class={`${getDropdownClasses()} ${className}`}>
      <Button 
        {...props}
        onClick={() => setIsOpen(!isOpen())}
        aria-expanded={isOpen()}
        aria-haspopup="true"
      >
        {children}
      </Button>
      
      <Show when={isOpen() && dropdownItems.length > 0}>
        <ul class={getContentClasses()}>
          <For each={dropdownItems}>
            {(item) => (
              <li>
                <a
                  href={item.href || '#'}
                  onClick={(e) => {
                    e.preventDefault();
                    setIsOpen(false);
                    if (item.onClick) item.onClick();
                  }}
                  classList={{ 'active': item.active }}
                >
                  {item.icon && <i data-lucide={item.icon} class="w-4 h-4 mr-2" />}
                  {item.label}
                </a>
              </li>
            )}
          </For>
        </ul>
      </Show>
    </div>
  );
};

// Icon-only button variant
export const IconButton = (props) => {
  const { icon, size = 'md', variant = 'ghost', ...rest } = props;

  return (
    <Button
      {...rest}
      variant={variant}
      size={size}
      circle
      class={props.class}
    >
      <i 
        data-lucide={icon} 
        class="w-4 h-4" 
        classList={{
          'w-3 h-3': size === 'xs',
          'w-4 h-4': size === 'sm' || size === 'md',
          'w-5 h-5': size === 'lg'
        }}
      />
    </Button>
  );
};

// Floating Action Button
export const FloatingActionButton = (props) => {
  const { icon, position = 'bottom-right', class: className = '', ...rest } = props;

  const getPositionClasses = () => {
    const positions = {
      'bottom-right': 'fixed bottom-4 right-4',
      'bottom-left': 'fixed bottom-4 left-4', 
      'top-right': 'fixed top-4 right-4',
      'top-left': 'fixed top-4 left-4'
    };
    return positions[position] || positions['bottom-right'];
  };

  return (
    <Button
      {...rest}
      circle
      size="lg"
      class={`${getPositionClasses()} ${className}`}
    >
      <i data-lucide={icon} class="w-6 h-6" />
    </Button>
  );
};

export default Button;