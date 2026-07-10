import type { Meta, StoryObj } from '@storybook/react';
import PdxNav from './PdxNav';
import PdxButton from '../button/PdxButton';
import PdxLink from '../link/PdxLink';
import PdxIcon from '../icon/PdxIcon';
import { Menu, Search } from 'lucide-react';

const meta: Meta<typeof PdxNav> = {
  title: 'Components/Nav',
  component: PdxNav,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    columns: {
      control: 'select',
      options: [2, 3],
      description: '布局列数',
    },
    canHide: {
      control: 'boolean',
      description: '是否可收起',
    },
    isFloat: {
      control: 'boolean',
      description: '是否浮动',
    },
    backgroundStyle: {
      control: 'select',
      options: ['Transparent', 'Solid', 'Blurred'],
      description: '背景样式',
    },
  },
};

export default meta;
type Story = StoryObj<typeof PdxNav>;

export const Default: Story = {
  render: () => (
    <PdxNav>
      <PdxNav.Left>
        <PdxLink to="/" text="Logo" />
      </PdxNav.Left>
      <PdxNav.Center>
        <PdxLink to="/products" text="Products" />
        <PdxLink to="/about" text="About" />
        <PdxLink to="/contact" text="Contact" />
      </PdxNav.Center>
      <PdxNav.Right>
        <PdxIcon icon={Search} />
        <PdxButton text="Sign Up" size="Small" />
      </PdxNav.Right>
    </PdxNav>
  ),
};

export const TwoColumns: Story = {
  render: () => (
    <PdxNav columns={2}>
      <PdxNav.Left>
        <PdxLink to="/" text="Logo" />
      </PdxNav.Left>
      <PdxNav.Right>
        <PdxLink to="/login" text="Login" />
        <PdxButton text="Get Started" size="Small" />
      </PdxNav.Right>
    </PdxNav>
  ),
};

export const ThreeColumns: Story = {
  render: () => (
    <PdxNav columns={3}>
      <PdxNav.Left>
        <PdxLink to="/" text="Logo" />
      </PdxNav.Left>
      <PdxNav.Center>
        <PdxLink to="/nav1" text="Nav Item 1" />
        <PdxLink to="/nav2" text="Nav Item 2" />
        <PdxLink to="/nav3" text="Nav Item 3" />
      </PdxNav.Center>
      <PdxNav.Right>
        <PdxIcon icon={Search} />
        <PdxButton text="Action" size="Small" />
      </PdxNav.Right>
    </PdxNav>
  ),
};

export const WithHeading: Story = {
  render: () => (
    <PdxNav>
      <PdxNav.Left>
        <PdxNav.Heading heading="My App" />
      </PdxNav.Left>
      <PdxNav.Center>
        <PdxLink to="/page1" text="Page 1" />
        <PdxLink to="/page2" text="Page 2" />
      </PdxNav.Center>
      <PdxNav.Right>
        <PdxButton
          text="Menu"
          size="Small"
          icon={<PdxIcon icon={Menu} />}
          iconPosition="Left"
        />
      </PdxNav.Right>
    </PdxNav>
  ),
};

export const TransparentBackground: Story = {
  render: () => (
    <div
      style={{
        background: 'var(--text-primary)',
        padding: '20px',
      }}
    >
      <PdxNav backgroundStyle="Transparent">
        <PdxNav.Left>
          <PdxLink
            to="/"
            text="Logo"
            style={{ color: 'var(--text-inverse)' }}
          />
        </PdxNav.Left>
        <PdxNav.Center>
          <PdxLink
            to="/products"
            text="Products"
            style={{ color: 'var(--text-inverse)' }}
          />
          <PdxLink
            to="/about"
            text="About"
            style={{ color: 'var(--text-inverse)' }}
          />
        </PdxNav.Center>
        <PdxNav.Right>
          <PdxButton text="Sign Up" size="Small" variant="Primary" />
        </PdxNav.Right>
      </PdxNav>
    </div>
  ),
};

export const BlurredBackground: Story = {
  render: () => (
    <PdxNav backgroundStyle="Blurred">
      <PdxNav.Left>
        <PdxLink to="/" text="Logo" />
      </PdxNav.Left>
      <PdxNav.Center>
        <PdxLink to="/nav1" text="Navigation 1" />
        <PdxLink to="/nav2" text="Navigation 2" />
        <PdxLink to="/nav3" text="Navigation 3" />
      </PdxNav.Center>
      <PdxNav.Right>
        <PdxButton text="Action" size="Small" />
      </PdxNav.Right>
    </PdxNav>
  ),
};

export const Float: Story = {
  render: () => (
    <div style={{ height: '200px', position: 'relative' }}>
      <PdxNav isFloat={true}>
        <PdxNav.Left>
          <PdxLink to="/" text="Floating Nav" />
        </PdxNav.Left>
        <PdxNav.Right>
          <PdxLink to="/about" text="About" />
        </PdxNav.Right>
      </PdxNav>
    </div>
  ),
};

export const CanHide: Story = {
  render: () => (
    <PdxNav canHide={true}>
      <PdxNav.Left>
        <PdxLink to="/" text="Collapsible Nav" />
      </PdxNav.Left>
      <PdxNav.Center>
        <PdxLink to="/item1" text="Item 1" />
        <PdxLink to="/item2" text="Item 2" />
        <PdxLink to="/item3" text="Item 3" />
      </PdxNav.Center>
      <PdxNav.Right>
        <PdxButton text="Menu" size="Small" />
      </PdxNav.Right>
    </PdxNav>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h3 style={{ marginBottom: '8px' }}>Solid Background</h3>
        <PdxNav backgroundStyle="Solid">
          <PdxNav.Left>
            <PdxLink to="/" text="Logo" />
          </PdxNav.Left>
          <PdxNav.Center>
            <PdxLink to="/nav" text="Nav" />
          </PdxNav.Center>
          <PdxNav.Right>
            <PdxButton text="Action" size="Small" />
          </PdxNav.Right>
        </PdxNav>
      </div>
      <div>
        <h3 style={{ marginBottom: '8px' }}>Blurred Background</h3>
        <PdxNav backgroundStyle="Blurred">
          <PdxNav.Left>
            <PdxLink to="/" text="Logo" />
          </PdxNav.Left>
          <PdxNav.Center>
            <PdxLink to="/nav" text="Nav" />
          </PdxNav.Center>
          <PdxNav.Right>
            <PdxButton text="Action" size="Small" />
          </PdxNav.Right>
        </PdxNav>
      </div>
    </div>
  ),
};
