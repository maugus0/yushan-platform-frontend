import { useState, useEffect, useRef } from 'react';
import { Form, Input, Button, message, Select, DatePicker, Space, Typography } from 'antd';
import authService from '../../services/auth';
import dayjs from 'dayjs';

const { Option } = Select;
const { Text } = Typography;

/* --------------------------------------------------
 * Configuration / Constants
 * -------------------------------------------------- */
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;

const MIN_AGE_YEARS = 12;
const OTP_VALID_MINUTES = 5;

/* --------------------------------------------------
 * Birthday Helpers
 * -------------------------------------------------- */
// Latest selectable birthday (user must be >= 12).
const maxAllowedBirthday = dayjs().subtract(MIN_AGE_YEARS, 'year').endOf('day');

// Disable future dates and dates making user younger than 12.
const disabledBirthdayDate = (current) => {
  if (!current) return false;
  return current.endOf('day').isAfter(maxAllowedBirthday);
};

/* --------------------------------------------------
 * Component
 * -------------------------------------------------- */
const AuthForm = ({ mode = 'login', onSuccess, loginError, registerError }) => {
  const isRegister = mode === 'register';
  const [form] = Form.useForm();

  const [submitting, setSubmitting] = useState(false);
  const [liveValidate, setLiveValidate] = useState(false);
  const [otpError, setOtpError] = useState(''); // State for OTP-specific errors

  // Debug logging for errors
  useEffect(() => {
    // Debug logging removed for production
    // if (registerError) {
    //   console.log('AuthForm received registerError:', registerError);
    // }
    // if (loginError) {
    //   console.log('AuthForm received loginError:', loginError);
  }, [registerError, loginError]);

  /**
   * OTP Countdown (timestamp-based)
   * We store the absolute expiration time (ms) so browser tab throttling
   * does NOT distort remaining time. remainingSeconds is derived.
   */
  const [otpExpireAt, setOtpExpireAt] = useState(null); // number (ms) or null
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [otpSending, setOtpSending] = useState(false);
  const intervalRef = useRef(null);

  const otpActive = remainingSeconds > 0;

  /* --------------------------------------------------
   * Countdown Effect (timestamp diff)
   * -------------------------------------------------- */
  useEffect(() => {
    if (!otpExpireAt) return;

    // Tick function computes difference
    const tick = () => {
      const diffMs = otpExpireAt - Date.now();
      const secs = Math.max(0, Math.ceil(diffMs / 1000));
      setRemainingSeconds(secs);
      if (secs <= 0) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    // Start interval (1s). Even if throttled, on visibility change we will force tick.
    intervalRef.current = setInterval(tick, 1000);

    // Immediate first tick to sync (but we already set initial value in startOtpCountdown)
    tick();

    // Visibility API: when user returns to the tab, correct any drift immediately.
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        tick();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [otpExpireAt]);

  /**
   * Start countdown helper:
   *  - Sets expiration timestamp
   *  - Sets initial remainingSeconds to exact full duration (e.g. 300)
   */
  const startOtpCountdown = () => {
    const expireAtMs = Date.now() + OTP_VALID_MINUTES * 60 * 1000;
    setOtpExpireAt(expireAtMs);
    setRemainingSeconds(OTP_VALID_MINUTES * 60); // show 05:00 instantly
  };

  /* --------------------------------------------------
   * Helpers
   * -------------------------------------------------- */
  const formatCountdown = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Reset OTP + countdown if email changes during an active OTP period.
  const handleEmailChange = () => {
    if (otpActive) {
      setOtpExpireAt(null);
      setRemainingSeconds(0);
      form.setFieldValue('otp', '');
    }
    // Clear OTP error when email changes
    if (otpError) {
      setOtpError('');
    }
  };

  const handleSendOtp = async () => {
    try {
      console.log('Sending OTP...');
      setOtpError(''); // Clear previous OTP errors
      await form.validateFields(['email']);
      const email = form.getFieldValue('email');
      setOtpSending(true);

      try {
        const response = await authService.sendVerificationEmail(email);
        console.log('OTP response:', response);
        message.success('Verification email sent successfully');
        startOtpCountdown();
      } catch (error) {
        console.error('OTP error:', error);
        // Use error.message first (from thrown Error objects), then fallback to response data
        const errorMessage =
          error.message || error.response?.data?.message || 'Failed to send verification email';
        setOtpError(errorMessage); // Set error to display above OTP field

        // Add visual feedback for email field if it's an email-related error
        if (errorMessage.toLowerCase().includes('email already')) {
          const emailInput = document.querySelector('input[type="email"]');
          if (emailInput) {
            emailInput.focus();
            emailInput.classList.add('shake');
            setTimeout(() => emailInput.classList.remove('shake'), 500);
          }
        }
      }
    } catch (error) {
      console.error('Validation error:', error);
      setOtpError('Please enter a valid email first');
    } finally {
      setOtpSending(false);
    }
  };

  const handleFinish = async (values) => {
    try {
      console.log('Form submitted with values:', values);
      setSubmitting(true);
      await onSuccess(values);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinishFailed = () => {
    if (!isRegister && !liveValidate) setLiveValidate(true);
  };

  const loginValidateTrigger = isRegister
    ? undefined
    : liveValidate
      ? ['onChange', 'onBlur']
      : ['onSubmit'];

  /* --------------------------------------------------
   * Birthday Rules (optional)
   * -------------------------------------------------- */
  const birthdayRules = [
    {
      validator: (_, value) => {
        if (!value) return Promise.resolve(); // optional
        if (value.endOf('day').isAfter(maxAllowedBirthday)) {
          return Promise.reject(new Error(`You must be at least ${MIN_AGE_YEARS} years old`));
        }
        return Promise.resolve();
      },
    },
  ];

  return (
    <Form
      form={form}
      layout="vertical"
      autoComplete="off"
      onFinish={handleFinish}
      onFinishFailed={handleFinishFailed}
      requiredMark
    >
      {/* Username (register only) */}
      {isRegister && (
        <Form.Item
          label="Username"
          name="username"
          rules={[
            { required: true, message: 'Username is required' },
            { min: 3, message: 'Minimum 3 characters' },
            { max: 20, message: 'Maximum 20 characters' },
          ]}
        >
          <Input placeholder="Enter username" />
        </Form.Item>
      )}

      {/* Login Error Display - Above Email */}
      {!isRegister && loginError && (
        <div
          style={{
            marginBottom: 16,
            padding: '8px 12px',
            backgroundColor: '#fff2f0',
            border: '1px solid #ffccc7',
            borderRadius: '4px',
            color: '#cf1322',
          }}
        >
          <Text type="danger" style={{ fontSize: '14px' }}>
            {loginError}
          </Text>
        </div>
      )}

      {/* Email (login only) */}
      {!isRegister && (
        <Form.Item
          label="Email"
          name="email"
          validateTrigger={loginValidateTrigger}
          rules={[
            { required: true, message: 'Email is required' },
            { type: 'email', message: 'Invalid email format' },
          ]}
        >
          <Input placeholder="Enter email" />
        </Form.Item>
      )}

      {/* Password */}
      <Form.Item
        label="Password"
        name="password"
        validateTrigger={loginValidateTrigger}
        rules={
          isRegister
            ? [
                { required: true, message: 'Password is required' },
                {
                  pattern: PASSWORD_REGEX,
                  message: 'Min 8 chars include uppercase, lowercase & number',
                },
              ]
            : [{ required: true, message: 'Password is required' }]
        }
        hasFeedback={isRegister}
      >
        <Input.Password placeholder="Enter password" />
      </Form.Item>

      {/* Confirm Password (register only) */}
      {isRegister && (
        <Form.Item
          label="Confirm Password"
          name="confirmPassword"
          dependencies={['password']}
          hasFeedback
          rules={[
            { required: true, message: 'Please confirm your password' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) return Promise.resolve();
                return Promise.reject(new Error('Passwords do not match'));
              },
            }),
          ]}
        >
          <Input.Password placeholder="Re-enter password" />
        </Form.Item>
      )}

      {/* Gender */}
      {isRegister && (
        <Form.Item
          label="Gender"
          name="gender"
          required
          rules={[{ required: true, message: 'Gender is required' }]}
        >
          <Select placeholder="Select gender" allowClear>
            <Option value="male">Male</Option>
            <Option value="female">Female</Option>
            <Option value="unknown">Unknown</Option>
          </Select>
        </Form.Item>
      )}

      {/* Birthday */}
      {isRegister && (
        <Form.Item
          label="Birthday"
          name="birthday"
          required
          rules={[{ required: true, message: 'Birthday is required' }, ...birthdayRules]}
        >
          <DatePicker
            style={{ width: '100%' }}
            placeholder={`Select birthday (≥ ${MIN_AGE_YEARS} years old)`}
            format="YYYY-MM-DD"
            disabledDate={disabledBirthdayDate}
            defaultPickerValue={maxAllowedBirthday}
          />
        </Form.Item>
      )}

      {/* Email + OTP (bottom for register) */}
      {isRegister && (
        <>
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: 'Email is required' },
              { type: 'email', message: 'Invalid email format' },
            ]}
          >
            <Input placeholder="Enter email" onChange={handleEmailChange} />
          </Form.Item>

          {/* OTP Error Display - Above OTP Field */}
          {otpError && (
            <div
              style={{
                marginBottom: 16,
                padding: '8px 12px',
                backgroundColor: '#fff2f0',
                border: '1px solid #ffccc7',
                borderRadius: '4px',
                color: '#cf1322',
              }}
            >
              <Text type="danger" style={{ fontSize: '14px' }}>
                {otpError}
              </Text>
            </div>
          )}

          <Form.Item
            label={
              <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                <span>OTP</span>
                <Button
                  type="link"
                  style={{ padding: 0, height: 'auto' }}
                  onClick={handleSendOtp}
                  disabled={otpSending || otpActive}
                >
                  {otpActive ? `Resend in ${formatCountdown(remainingSeconds)}` : 'Send OTP'}
                </Button>
              </Space>
            }
            name="otp"
            rules={[
              { required: true, message: 'OTP is required' },
              { pattern: /^\d{6}$/, message: 'OTP must be 6 digits' },
            ]}
            extra={
              otpActive ? (
                <Text type="secondary">
                  OTP active • Remaining {formatCountdown(remainingSeconds)}
                </Text>
              ) : (
                <Text type="secondary">
                  Click "Send OTP" to receive a code (valid {OTP_VALID_MINUTES} mins)
                </Text>
              )
            }
          >
            <Input placeholder="Enter OTP" inputMode="numeric" />
          </Form.Item>
        </>
      )}

      {/* Register Error Display */}
      {isRegister && registerError && (
        <div
          style={{
            marginBottom: 16,
            padding: '8px 12px',
            backgroundColor: '#fff2f0',
            border: '1px solid #ffccc7',
            borderRadius: '4px',
            color: '#cf1322',
          }}
        >
          <Text type="danger" style={{ fontSize: '14px' }}>
            {registerError}
          </Text>
        </div>
      )}

      {/* Submit */}
      <Form.Item>
        <Button type="primary" htmlType="submit" loading={submitting} block>
          {isRegister ? 'Create Account' : 'Login'}
        </Button>
      </Form.Item>

      {/* ===== REAL BACKEND INTEGRATION GUIDE =====
       *
       * 1. Service functions (e.g. src/services/authService.js):
       *       import api from './api';
       *       export const apiLogin = (data) => api.post('/auth/login', data);
       *       export const apiRegister = (data) => api.post('/auth/register', data);
       *       export const apiSendOtp = (email) => api.post('/auth/send-otp', { email });
       *
       * 2. Replace mockSendOtp in handleSendOtp():
       *       const { data } = await apiSendOtp(email);
       *       if (data.success) startOtpCountdown(); else message.error(data.message || 'Send failed');
       *
       * 3. Replace static register logic:
       *       const { data } = await apiRegister(payload);
       *       message.success('Registration successful');
       *       localStorage.setItem('token', data.token);
       *       onSuccess && onSuccess(data);
       *
       * 4. Replace static login logic:
       *       const { data } = await apiLogin({ email: payload.email, password: payload.password });
       *       message.success('Login successful');
       *       localStorage.setItem('token', data.token);
       *       onSuccess && onSuccess(data);
       *
       * 5. Remove USE_STATIC_DEMO_CHECK & related demo code.
       *
       * 6. Error handling:
       *       try { ... } catch (err) {
       *         message.error(err.response?.data?.message || 'Server error');
       *       }
       *
       * 7. Security:
       *       - Hash passwords server-side.
       *       - Rate limit OTP endpoint.
       *       - Avoid console logging sensitive data in production.
       *
       * 8. Optional enhancements:
       *       - Disable email input while OTP active (disabled={otpActive})
       *       - Add password strength meter
       *       - Add a “Paste OTP” auto-detect
       */}
    </Form>
  );
};

export default AuthForm;
