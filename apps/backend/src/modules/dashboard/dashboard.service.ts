class DashboardService {
  getAccountBalance() {
    return Promise.resolve(1_000_000);
  }
}

const dashboardService = new DashboardService();

export default dashboardService;
