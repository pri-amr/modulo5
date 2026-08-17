type LoaderProps = {
  visible: boolean;
};

const Loader = ({ visible }: LoaderProps): React.JSX.Element | null => {
  if (!visible) {
    return null;
  }

  return (
    <div
      role="status"
      aria-label="Cargando"
      className="h-8 w-8 animate-spin rounded-full border-4 border-accent-blue border-t-transparent"
    />
  );
};

export default Loader;
