'use client'

import { login, signup } from './actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

export default function LoginPage() {
    const [loadingGoogle, setLoadingGoogle] = useState(false)
    const supabase = createClient()

    const handleGoogleLogin = async () => {
        setLoadingGoogle(true)
        const origin = typeof window !== 'undefined' ? window.location.origin : ''
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${origin}/auth/callback`,
            },
        })
        if (error) {
            console.error(error)
            setLoadingGoogle(false)
        }
    }

    const handleLogin = async (formData: FormData) => {
        const res = await login(formData)
        if (res?.error) alert(res.error)
    }

    const handleSignup = async (formData: FormData) => {
        const res = await signup(formData)
        if (res?.error) alert(res.error)
    }

    return (
        <div className="flex h-screen w-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
            <Card className="mx-auto w-[400px]">
                <CardHeader>
                    <CardTitle className="text-2xl text-center">Central de Pedidos</CardTitle>
                    <CardDescription className="text-center">
                        Acesse sua conta ou crie uma nova
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="login" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-4">
                            <TabsTrigger value="login">Entrar</TabsTrigger>
                            <TabsTrigger value="signup">Criar Conta</TabsTrigger>
                        </TabsList>

                        <TabsContent value="login">
                            <form
                                className="space-y-4"
                                onSubmit={async (e) => {
                                    e.preventDefault()
                                    const form = e.currentTarget as HTMLFormElement
                                    const formData = new FormData(form)
                                    await handleLogin(formData)
                                }}
                            >
                                <div className="space-y-2">
                                    <Label htmlFor="email">E-mail</Label>
                                    <Input id="email" name="email" type="email" placeholder="m@exemplo.com" required />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center">
                                        <Label htmlFor="password">Senha</Label>
                                    </div>
                                    <Input id="password" name="password" type="password" required />
                                </div>
                                <Button type="submit" className="w-full mt-4">
                                    Entrar
                                </Button>
                            </form>
                        </TabsContent>

                        <TabsContent value="signup">
                            <form action={handleSignup} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="signup-email">E-mail</Label>
                                    <Input id="signup-email" name="email" type="email" placeholder="m@exemplo.com" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="signup-password">Senha</Label>
                                    <Input id="signup-password" name="password" type="password" required />
                                </div>
                                <Button type="submit" className="w-full mt-4">
                                    Criar Conta
                                </Button>
                            </form>
                        </TabsContent>
                    </Tabs>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">
                                Ou continue com
                            </span>
                        </div>
                    </div>

                    <Button
                        variant="outline"
                        type="button"
                        className="w-full"
                        onClick={handleGoogleLogin}
                        disabled={loadingGoogle}
                    >
                        {loadingGoogle ? (
                            <span className="animate-pulse">Redirecionando...</span>
                        ) : (
                            <>
                                <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                                    <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                                </svg>
                                Conta Google
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
