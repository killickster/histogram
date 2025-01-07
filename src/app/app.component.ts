import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  title = 'histogram-component';
  data: any; // Variable to hold the JSON data

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadData();
  }

  // Method to load JSON data
  loadData(): void {
    this.http.get('assets/d1.json').subscribe((response) => {
      console.log(response); // For debugging
      this.data = response;
    });
  }
}