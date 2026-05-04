import styles from '../ui/Input.module.css';

export default function Input({
  label, error, hint, leftIcon, rightIcon, ...props
}) {
  return (
    <div className={styles.field}>
      {label && <label className={styles.label}>{label}</label>}
      <div className={styles.wrap}>
        {leftIcon && <span className={styles.icon}>{leftIcon}</span>}
        <input className={styles.input} {...props} />
        {rightIcon && <span className={styles.rightIcon}>{rightIcon}</span>}
      </div>
      {error && <span className={styles.error}>{error}</span>}
      {!error && hint && <span className={styles.hint}>{hint}</span>}
    </div>
  );
}
