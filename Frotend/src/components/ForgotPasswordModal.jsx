import React, { useState } from 'react'
import axios from 'axios'

// Reusable forgot password modal
// Props:
//  - initialEmail: prefill email input (optional)
//  - onClose: callback to close modal
//  - onSent: optional callback when OTP successfully sent (receives { email, otp })
export default function ForgotPasswordModal({ initialEmail = '', onClose, onSent, isUser = true }) {
    const [step, setStep] = useState('email') // email | otp | reset | done
    const [email, setEmail] = useState(initialEmail)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [info, setInfo] = useState('')
    const [serverOtp, setServerOtp] = useState('')
    const [userOtp, setUserOtp] = useState('')
    const [newPass, setNewPass] = useState('')
    const [confirmPass, setConfirmPass] = useState('')
    const [userId, setUserId] = useState('')

    const genOtp = () => Math.floor(1000 + Math.random() * 9000).toString()

    const startFlow = async () => {
        setError('')
        setInfo('')
        const mail = (email || '').trim()
        if (!mail) return setError('Please enter your email')
        const emailRegex = /[^@\s]+@[^@\s]+\.[^@\s]+/
        if (!emailRegex.test(mail)) return setError('Invalid email format')
        try {
            setLoading(true)
            // Check user existence
            const base = isUser ? 'users' : 'captains'
            const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/${base}/findByEmail`, { params: { email: mail } })
            if (!res.data || !res.data._id) {
                setError('No user exists with this email')
                return
            }
            setUserId(res.data._id)
            // Generate & send OTP
            const otp = genOtp()
            setServerOtp(otp)
            const subject = `Password Reset Request`.trim();
            const msg = `

Hello there! 👋

We received a request to reset your password for your AbhiGo account.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Your One-Time Password (OTP):

    ${otp}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📱 Next Steps:
   • Enter this OTP on the website to verify your identity
   • Create a new secure password for your account

⚠️ Important Security Notes:
   ⏱️  This OTP expires in 10 minutes
   🔒 Never share this code with anyone
   ❌ If you didn't request this, please ignore this email

Need help? Contact our support team anytime.

Safe travels! 🚗
The AbhiGo Support Team
    `.trim();
            await axios.get('https://cloud.automatisch.io/webhooks/flows/d4d752f6-d7bb-4e6a-bfaa-e7a751961eed/sync', {
                params: { To: mail, Subject: subject, Msg: msg }
            })
            setInfo('OTP sent to your email')
            if (onSent) onSent({ email: mail, otp })
            setStep('otp')
        } catch (e) {
            if (e?.response?.status === 404) {
                setError('No user exists with this email')
            } else {
                setError('Failed to start reset flow. Try again.')
            }
        } finally {
            setLoading(false)
        }
    }

    const verifyOtp = () => {
        setError('')
        if (!userOtp.trim()) return setError('Enter OTP')
        if (userOtp.trim() !== serverOtp) return setError('Incorrect OTP')
        setInfo('OTP verified')
        setStep('reset')
    }

    const validatePassword = (pwd) => {
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(pwd);
        const hasLowerCase = /[a-z]/.test(pwd);
        const hasNumber = /[0-9]/.test(pwd);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(pwd);

        if (pwd.length < minLength) {
            return "Password must be at least 8 characters long";
        }
        if (!hasUpperCase) {
            return "Password must contain at least one uppercase letter";
        }
        if (!hasLowerCase) {
            return "Password must contain at least one lowercase letter";
        }
        if (!hasNumber) {
            return "Password must contain at least one number";
        }
        if (!hasSpecialChar) {
            return "Password must contain at least one special character";
        }
        return null;
    };

    const submitNewPassword = async () => {
        setError('')
        setInfo('')
        if (!newPass || !confirmPass) return setError('Fill both password fields')
        if (newPass !== confirmPass) return setError('Passwords do not match')
        
        const passwordError = validatePassword(newPass);
        if (passwordError) return setError(passwordError)
        try {
            setLoading(true)
            if (isUser) {
                await axios.post(`${import.meta.env.VITE_BASE_URL}/users/updatePassword`, { userId, pasword: newPass })
            } else {
                await axios.post(`${import.meta.env.VITE_BASE_URL}/captains/updatePassword`, { captainId: userId, password: newPass })
            }
            setInfo('Password updated successfully. You can now log in.')
            setStep('done')
        } catch (e) {
            setError('Failed to update password')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'>
            <div className='bg-white w-[92%] max-w-md rounded-xl shadow-lg overflow-hidden'>
                <div className='px-5 py-4 border-b flex items-center justify-between'>
                    <h3 className='text-lg font-semibold'>Reset password</h3>
                    <button onClick={() => !loading && onClose && onClose()} className='text-gray-500 hover:text-black' aria-label='Close'>✕</button>
                </div>
                <div className='p-5'>
                    {step === 'email' && (
                        <>
                            <label className='block text-sm font-medium mb-2'>Email</label>
                            <input
                                type='email'
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder='example@gmail.com'
                                className='w-full px-3 py-2 border rounded-lg bg-[#f7f7f7]'
                                disabled={loading}
                            />
                        </>
                    )}
                    {step === 'otp' && (
                        <>
                            <label className='block text-sm font-medium mb-2'>Enter OTP</label>
                            <input
                                value={userOtp}
                                onChange={(e) => setUserOtp(e.target.value)}
                                maxLength={6}
                                placeholder='4-digit code'
                                className='w-full px-3 py-2 border rounded-lg bg-[#f7f7f7] tracking-widest'
                                disabled={loading}
                            />
                            <p className='mt-2 text-xs text-gray-500'>Sent to {email}</p>
                            <button type='button' onClick={startFlow} disabled={loading} className='mt-3 text-xs text-blue-600 hover:underline'>Resend OTP</button>
                        </>
                    )}
                    {step === 'reset' && (
                        <>
                            <label className='block text-sm font-medium mb-2'>New Password</label>
                            <input
                                type='password'
                                value={newPass}
                                onChange={(e) => setNewPass(e.target.value)}
                                placeholder='••••••'
                                className='w-full px-3 py-2 border rounded-lg bg-[#f7f7f7]'
                                disabled={loading}
                            />
                            <label className='block text-sm font-medium mb-2 mt-4'>Confirm Password</label>
                            <input
                                type='password'
                                value={confirmPass}
                                onChange={(e) => setConfirmPass(e.target.value)}
                                placeholder='••••••'
                                className='w-full px-3 py-2 border rounded-lg bg-[#f7f7f7]'
                                disabled={loading}
                            />
                        </>
                    )}
                    {step === 'done' && (
                        <p className='text-sm text-green-700'>Password updated successfully.</p>
                    )}
                    {error && <p className='mt-3 text-sm text-red-600'>{error}</p>}
                    {/* {info && <p className='mt-3 text-sm text-green-600'>{info}</p>} */}
                </div>
                <div className='px-5 pb-5'>
                    {step === 'email' && (
                        <button
                            type='button'
                            onClick={startFlow}
                            disabled={loading}
                            className={`w-full py-2 rounded-lg font-semibold ${loading ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-black text-white'}`}
                        >
                            {loading ? 'Checking…' : 'Continue'}
                        </button>
                    )}
                    {step === 'otp' && (
                        <button
                            type='button'
                            onClick={verifyOtp}
                            disabled={loading || !userOtp.trim()}
                            className={`w-full py-2 rounded-lg font-semibold ${(loading || !userOtp.trim()) ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-black text-white'}`}
                        >
                            Verify OTP
                        </button>
                    )}
                    {step === 'reset' && (
                        <button
                            type='button'
                            onClick={submitNewPassword}
                            disabled={loading || !newPass || !confirmPass}
                            className={`w-full py-2 rounded-lg font-semibold ${(loading || !newPass || !confirmPass) ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-black text-white'}`}
                        >
                            Save Password
                        </button>
                    )}
                    {step === 'done' && (
                        <button
                            type='button'
                            onClick={() => onClose && onClose()}
                            className='w-full py-2 rounded-lg font-semibold bg-black text-white'
                        >
                            Close
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
