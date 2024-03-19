import './button.scss';
import { IButton } from './entities';

const Button = ({ type, label, onClick }: IButton): JSX.Element => {
  const buttonClassName: string = 'button';

  return (
    <button
      onClick={onClick}
      className={`${buttonClassName} ${buttonClassName}--${type}`}
    >
      {label}
    </button>
  );
};

export default Button;
