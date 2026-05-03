import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { Link, useNavigate } from 'react-router-dom'
import { FaTimes } from 'react-icons/fa'
import api, { getApiError } from '../../models/api'

const schema = yup.object({
  email: yup
    .string()
    .required('Email không được để trống')
    .email('Email không đúng định dạng'),
  password: yup
    .string()
    .required('Mật khẩu không được để trống')
    .min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
})

const forgotSchema = yup.object({
  email: yup
    .string()
    .required('Email không được để trống')
    .email('Email không đúng định dạng'),
})

export default function Login() {
  const navigate = useNavigate()
  const [forgotOpen, setForgotOpen] = useState(false)
  const [forgotFeedback, setForgotFeedback] = useState(null)
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
  })

  const forgotForm = useForm({
    resolver: yupResolver(forgotSchema),
    defaultValues: { email: '' },
  })

  const onSubmit = async (data) => {
    setServerError('')
    try {
      const response = await api.post('/auth/login', data)
      const { user, token } = response.data

      localStorage.setItem('user', JSON.stringify(user))
      localStorage.setItem('token', token)

      if (user.role === 'admin') {
        navigate('/admin')
      } else {
        navigate('/staff')
      }
    } catch (error) {
      setServerError(getApiError(error, 'Sai tài khoản hoặc mật khẩu'))
      return
    }
  }

  const openForgotModal = () => {
    setForgotFeedback(null)
    forgotForm.reset({ email: getValues('email') || '' })
    setForgotOpen(true)
  }

  const closeForgotModal = () => {
    setForgotOpen(false)
    setForgotFeedback(null)
    forgotForm.reset({ email: '' })
  }

  const onForgotSubmit = async (data) => {
    setForgotFeedback(null)

    try {
      const email = data.email.trim().toLowerCase()
      const response = await api.post('/auth/forgot-password', { email })
      setForgotFeedback({
        type: 'success',
        message: response.data?.message || 'Đã xử lý. Kiểm tra email hoặc thông báo từ hệ thống.',
      })
    } catch (error) {
      setForgotFeedback({
        type: 'error',
        message: getApiError(error, 'Không gửi được mật khẩu mới. Thử lại sau.'),
      })
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-slate-800">Đăng nhập</h1>
          <p className="mt-2 text-sm text-slate-500">
            Đăng nhập vào hệ thống quản lý nhà thuốc
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {serverError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {serverError}
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              type="email"
              placeholder="Nhập email"
              {...register('email')}
              className={`w-full rounded-xl border px-4 py-3 outline-none transition ${
                errors.email
                  ? 'border-red-500 focus:border-red-500'
                  : 'border-slate-300 focus:border-blue-500'
              }`}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Mật khẩu
            </label>
            <input
              type="password"
              placeholder="Nhập mật khẩu"
              {...register('password')}
              className={`w-full rounded-xl border px-4 py-3 outline-none transition ${
                errors.password
                  ? 'border-red-500 focus:border-red-500'
                  : 'border-slate-300 focus:border-blue-500'
              }`}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
            )}
            <div className="mt-2 flex justify-end">
              <button
                type="button"
                onClick={openForgotModal}
                className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
              >
                Quên mật khẩu?
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-70"
          >
            {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Chưa có tài khoản?{' '}
          <Link to="/register" className="font-semibold text-blue-600 hover:underline">
            Đăng ký ngay
          </Link>
        </p>
      </div>

      {forgotOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          role="presentation"
          onClick={closeForgotModal}
        >
          <div
            className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="forgot-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={closeForgotModal}
              className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              aria-label="Đóng"
            >
              <FaTimes />
            </button>

            <h2 id="forgot-title" className="pr-8 text-xl font-bold text-slate-800">
              Quên mật khẩu
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Nhập email đã đăng ký. Hệ thống sẽ tạo mật khẩu mới và gửi trực tiếp vào email (không cần mở
              link).
            </p>

            <form onSubmit={forgotForm.handleSubmit(onForgotSubmit)} className="mt-5 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
                <input
                  type="email"
                  placeholder="Nhập email đăng ký"
                  autoComplete="email"
                  {...forgotForm.register('email')}
                  className={`w-full rounded-xl border px-4 py-3 outline-none transition ${
                    forgotForm.formState.errors.email
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-slate-300 focus:border-blue-500'
                  }`}
                />
                {forgotForm.formState.errors.email && (
                  <p className="mt-1 text-sm text-red-500">
                    {forgotForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              {forgotFeedback && (
                <div
                  className={`rounded-xl border px-4 py-3 text-sm ${
                    forgotFeedback.type === 'success'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                      : 'border-red-200 bg-red-50 text-red-700'
                  }`}
                >
                  {forgotFeedback.message}
                </div>
              )}

              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeForgotModal}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={forgotForm.formState.isSubmitting}
                  className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-70"
                >
                  {forgotForm.formState.isSubmitting ? 'Đang gửi...' : 'Gửi mật khẩu qua email'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
