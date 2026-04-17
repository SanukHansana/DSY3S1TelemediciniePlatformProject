# Kubernetes Setup

This folder converts the current Docker Compose project into a Minikube-friendly Kubernetes deployment.

It does not require any extra tool beyond:

- Docker Desktop
- Minikube
- `kubectl`

`kompose` is not required because the manifests are already included here.

You do not need any extra software to run this Kubernetes version locally.
Docker Desktop, Minikube, and `kubectl` are enough for this project as it stands.
If you later want a single public URL instead of port-forwarding, the only optional extra is enabling the Minikube ingress addon.

## What This Setup Uses

- All application services run inside Kubernetes.
- MongoDB stays external and uses the same Atlas connection strings already present in the service `.env` files.
- Internal service-to-service traffic uses Kubernetes service DNS names such as `http://appointment-service:4003`.
- The frontend now proxies API calls to Kubernetes service DNS names from inside the frontend container.
- Because of that proxy setup, the browser only needs access to the frontend itself.

## 1. Start Minikube

```powershell
minikube start --driver=docker
kubectl config use-context minikube
```

## 2. Build Images Into Minikube

Run these from the project root:

```powershell
minikube image build -t telemedicine/auth-service:local ./services/auth-service
minikube image build -t telemedicine/patient-service:local ./services/patient-service
minikube image build -t telemedicine/doctor-service:local ./services/doctor-service
minikube image build -t telemedicine/appointment-service:local ./services/appointment-service
minikube image build -t telemedicine/telemedicine-service:local ./services/telemedicine-service
minikube image build -t telemedicine/payment-service:local ./services/payment-service
minikube image build -t telemedicine/notification-service:local ./services/notification-service
minikube image build -t telemedicine/frontend:local ./frontend
```

## 3. Apply The Manifests

The simplest way is:

```powershell
kubectl apply -k k8s
```

If you prefer the explicit file-by-file flow, this does the same thing:

```powershell
kubectl apply -f k8s/00-namespace.yaml
kubectl apply -f k8s/01-secrets.yaml
kubectl apply -f k8s/02-deployments.yaml
kubectl apply -f k8s/03-services.yaml
```

## 4. Check The Workloads

```powershell
kubectl get pods -n telemedicine
kubectl get services -n telemedicine
```

## 5. Access The Project Locally

With the frontend proxy in place, you only need to port-forward the frontend service:

```powershell
kubectl port-forward -n telemedicine svc/frontend 5173:5173
```

Then open:

```text
http://localhost:5173
```

## 6. Clean Up

```powershell
kubectl delete namespace telemedicine
```

## Notes

- The manifests intentionally keep your existing service ports.
- `auth-service`, `patient-service`, and `doctor-service` share the same JWT secret through the Kubernetes secret.
- `notification-service` receives both `MONGO_URI` and `MONGODB_URI` in Kubernetes so it stays compatible with the current repo files.
- The frontend deployment injects Kubernetes service URLs into Vite so browser requests flow through the frontend proxy instead of hardcoded `localhost` ports.
- This setup uses the current Atlas URIs from the repo. If you want a fully self-contained Kubernetes deployment later, the next step would be adding Mongo deployments or StatefulSets inside the cluster.
