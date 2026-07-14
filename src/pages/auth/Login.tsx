import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldLabel,
    FieldError,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { AuthService } from "@/services/auth/auth.service"

export default function LoginPage({
    className,
    ...props
}: React.ComponentProps<"div">) {
    const [usernameOrEmail, setUsernameOrEmail] = useState("")
    const [password, setPassword] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const navigate = useNavigate()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)
        try {
            await AuthService.login({ usernameOrEmail, password })
            localStorage.setItem("isLoggedIn", "true");
            localStorage.setItem("usernameOrEmail", usernameOrEmail);
            localStorage.setItem("password", password);
            navigate("/")
        } catch (err: any) {
            console.error("Login error:", err)
            setError(err.response?.data?.message || err.message || "Invalid email or password.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
            <div className="w-full max-w-sm">
                <div className={cn("flex flex-col gap-6", className)} {...props}>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-center">Login to your account</CardTitle>
                            {/*<CardDescription>*/}
                            {/*    Enter your email below to login to your account*/}
                            {/*</CardDescription>*/}
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit}>
                                <FieldGroup>
                                    <Field>
                                        <FieldLabel htmlFor="email">Email</FieldLabel>
                                        <Input
                                            id="usernameOrEmail"
                                            type="text"
                                            placeholder="Enter your username or email"
                                            required
                                            value={usernameOrEmail}
                                            onChange={(e) => setUsernameOrEmail(e.target.value)}
                                            disabled={isLoading}
                                        />
                                    </Field>
                                    <Field>
                                        <div className="flex items-center">
                                            <FieldLabel htmlFor="password">Password</FieldLabel>
                                            <a
                                                href="#"
                                                className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                                            >
                                                Forgot your password?
                                            </a>
                                        </div>
                                        <Input
                                            id="password"
                                            type="password"
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            disabled={isLoading}
                                        />
                                    </Field>
                                    {error && <FieldError>{error}</FieldError>}
                                    <Field>
                                        <Button type="submit" disabled={isLoading}>
                                            {isLoading ? "Logging in..." : "Login"}
                                        </Button>
                                        <Button variant="outline" type="button" disabled={isLoading}>
                                            Login with Google
                                        </Button>
                                        <FieldDescription className="text-center">
                                            Don&apos;t have an account? <a href="#">Sign up</a>
                                        </FieldDescription>
                                    </Field>
                                </FieldGroup>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>

    )
}

